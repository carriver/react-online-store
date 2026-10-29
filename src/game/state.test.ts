import { describe, expect, it } from 'vitest';
import type { Product } from '../cart';
import { STARTING_COINS, itemYieldPerSecond } from './economy';
import { createInitialState, gameReducer, type GameAction, type GameState } from './state';

const backpack: Product = { id: 1, title: 'Backpack', price: 100, description: '', category: '', image: 'https://example.com/a.png' };
const play = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const start = (overrides: Partial<GameState> = {}) => ({ ...createInitialState(0), ...overrides });

describe('gameReducer', () => {
  it('earns coins continuously from owned items while the player is here', () => {
    const state = play(start({ coins: 0, cart: [{ ...backpack, amount: 1, paid: 100 }] }), { type: 'tick', now: 2000 });
    expect(state.coins).toBeCloseTo(2 * (0.5 + itemYieldPerSecond(100)));
    expect(state.awayEarnings).toBeNull();
  });

  it('banks a long absence as welcome-back earnings, capped by the hopper', () => {
    const away = play(start({ coins: 0 }), { type: 'tick', now: 5 * 3600 * 1000 });
    expect(away.coins).toBe(0);
    expect(away.awayEarnings).toEqual({ coins: 1800, seconds: 5 * 3600 });
    expect(play(away, { type: 'collectAwayEarnings' }).coins).toBe(1800);
  });

  it('starts the player with enough coins for a cheap first item', () => {
    expect(start().coins).toBe(STARTING_COINS);
  });

  it('charges coins for items, more for each extra copy, and records the find', () => {
    const once = play(start({ coins: 300 }), { type: 'buy', product: backpack });
    const twice = play(once, { type: 'buy', product: backpack });
    expect(once.coins).toBe(200);
    expect(twice.coins).toBe(81);
    expect(twice.cart).toEqual([{ ...backpack, amount: 2, paid: 219 }]);
    expect(twice.discovered).toEqual([1]);
  });

  it('refuses to sell an item the player cannot afford', () => {
    const state = start({ coins: 99 });
    expect(play(state, { type: 'buy', product: backpack })).toBe(state);
  });

  it('refunds exactly what was paid, so buying and selling back never makes coins', () => {
    const state = play(
      start({ coins: 300 }),
      { type: 'buy', product: backpack },
      { type: 'buy', product: backpack },
      { type: 'remove', productId: 1 },
      { type: 'remove', productId: 1 },
    );
    expect(state.coins).toBe(300);
    expect(state.cart).toEqual([]);
  });

  it('activates a bought coupon right away and discounts items until checkout', () => {
    const state = play(start({ coins: 700 }), { type: 'buyCoupon', coupon: 'coupon10' }, { type: 'buy', product: backpack });
    expect(state.appliedCoupon).toBe('coupon10');
    expect(state.coins).toBe(10);
    expect(state.cart[0].paid).toBe(90);
  });

  it('replaces the active coupon with a bigger one, and refuses smaller or equal ones', () => {
    const withTen = play(start({ coins: 5000 }), { type: 'buyCoupon', coupon: 'coupon10' });
    expect(play(withTen, { type: 'buyCoupon', coupon: 'coupon10' })).toBe(withTen);
    expect(play(withTen, { type: 'buyCoupon', coupon: 'coupon5' })).toBe(withTen);
    const upgraded = play(withTen, { type: 'buyCoupon', coupon: 'coupon20' });
    expect(upgraded).toMatchObject({ appliedCoupon: 'coupon20', coins: 5000 - 600 - 2500 });
  });

  it('only buys what the player can afford', () => {
    expect(play(start({ coins: 10 }), { type: 'buyPerk', perk: 'vibes' }).perks.vibes).toBe(0);
    const bought = play(start({ coins: 110 }), { type: 'buyPerk', perk: 'vibes' });
    expect(bought.perks.vibes).toBe(1);
    expect(bought.coins).toBe(10);
  });

  it('buys a theme once, then switches between owned themes for free', () => {
    const bought = play(start({ coins: 300 }), { type: 'chooseTheme', theme: 'midnight' });
    expect(bought).toMatchObject({ coins: 0, theme: 'midnight', ownedThemes: ['sunny', 'midnight'] });
    expect(play(bought, { type: 'chooseTheme', theme: 'sunny' }, { type: 'chooseTheme', theme: 'midnight' }).coins).toBe(0);
  });

  it('checks out into stamps, ends the coupon and prints a receipt', () => {
    const state = play(
      start({ coins: 900 }),
      { type: 'buyCoupon', coupon: 'coupon10' },
      { type: 'buy', product: backpack },
      { type: 'buy', product: backpack },
      { type: 'checkout', now: 42 },
    );
    expect(state.cart).toEqual([]);
    expect(state.appliedCoupon).toBeNull();
    expect(state.coins).toBe(900 - 600 - 90 - 107);
    expect(state.stamps).toBe(4);
    expect(state.lastReceipt).toMatchObject({ number: 1, value: 200, spent: 197, coupon: 'coupon10', stampsEarned: 4, printedAt: 42 });
  });

  it('remembers that the guide was read', () => {
    expect(play(start(), { type: 'closeGuide' }).seenGuide).toBe(true);
  });

  it('ignores checkout with an empty cart', () => {
    const state = start();
    expect(play(state, { type: 'checkout', now: 1 })).toBe(state);
  });
});
