import { describe, expect, it } from 'vitest';
import type { Product } from '../cart';
import { discoveryBonus, itemYieldPerSecond } from './economy';
import { createInitialState, gameReducer, type GameAction, type GameState } from './state';

const backpack: Product = { id: 1, title: 'Backpack', price: 100, description: '', category: '', image: 'https://example.com/a.png' };
const play = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const start = (overrides: Partial<GameState> = {}) => ({ ...createInitialState(0), ...overrides });

describe('gameReducer', () => {
  it('earns coins continuously from owned items while the player is here', () => {
    const state = play(start({ cart: [{ ...backpack, amount: 1 }] }), { type: 'tick', now: 2000 });
    expect(state.coins).toBeCloseTo(2 * (0.5 + itemYieldPerSecond(100)));
    expect(state.awayEarnings).toBeNull();
  });

  it('banks a long absence as welcome-back earnings, capped by the hopper', () => {
    const away = play(start(), { type: 'tick', now: 5 * 3600 * 1000 });
    expect(away.coins).toBe(0);
    expect(away.awayEarnings).toEqual({ coins: 1800, seconds: 5 * 3600 });
    expect(play(away, { type: 'collectAwayEarnings' }).coins).toBe(1800);
  });

  it('pays a discovery bonus only the first time a product is found', () => {
    const once = play(start(), { type: 'add', product: backpack });
    const twice = play(once, { type: 'add', product: backpack });
    expect(once.coins).toBe(discoveryBonus(backpack));
    expect(twice.coins).toBe(once.coins);
    expect(twice.cart).toEqual([{ ...backpack, amount: 2 }]);
  });

  it('does not refund the discovery bonus by removing and re-adding', () => {
    const state = play(start(), { type: 'add', product: backpack }, { type: 'remove', productId: 1 }, { type: 'add', product: backpack });
    expect(state.coins).toBe(discoveryBonus(backpack));
  });

  it('only buys what the player can afford', () => {
    expect(play(start({ coins: 10 }), { type: 'buyPerk', perk: 'vibes' }).perks.vibes).toBe(0);
    const bought = play(start({ coins: 60 }), { type: 'buyPerk', perk: 'vibes' });
    expect(bought.perks.vibes).toBe(1);
    expect(bought.coins).toBe(10);
  });

  it('buys a theme once, then switches between owned themes for free', () => {
    const bought = play(start({ coins: 300 }), { type: 'chooseTheme', theme: 'midnight' });
    expect(bought).toMatchObject({ coins: 0, theme: 'midnight', ownedThemes: ['sunny', 'midnight'] });
    expect(play(bought, { type: 'chooseTheme', theme: 'sunny' }, { type: 'chooseTheme', theme: 'midnight' }).coins).toBe(0);
  });

  it('checks out into stamps, spends the coupon and prints a receipt', () => {
    const state = play(
      start({ coins: 600 }),
      { type: 'add', product: backpack },
      { type: 'add', product: backpack },
      { type: 'buyCoupon', coupon: 'coupon10' },
      { type: 'checkout', now: 42 },
    );
    expect(state.cart).toEqual([]);
    expect(state.coupons).toEqual([]);
    expect(state.appliedCoupon).toBeNull();
    expect(state.stamps).toBe(4);
    expect(state.lastReceipt).toMatchObject({ number: 1, subtotal: 200, total: 180, coupon: 'coupon10', stampsEarned: 4, printedAt: 42 });
  });

  it('ignores checkout with an empty cart', () => {
    const state = start();
    expect(play(state, { type: 'checkout', now: 1 })).toBe(state);
  });
});
