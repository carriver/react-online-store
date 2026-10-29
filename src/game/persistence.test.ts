import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave } from './persistence';
import { STARTING_COINS } from './economy';
import { createInitialState } from './state';

describe('persistence', () => {
  it('round-trips a saved game, without the receipt on screen', () => {
    const state = {
      ...createInitialState(1000),
      coins: 1234.5,
      cart: [{ id: 3, title: 'Jacket', price: 55.99, description: '', category: "men's clothing", image: 'https://example.com/j.png', amount: 2, paid: 130 }],
      discovered: [3],
      perks: { vibes: 2, thumb: 1, hopper: 0 },
      appliedCoupon: 'coupon10' as const,
      ownedThemes: ['sunny' as const, 'matcha' as const],
      theme: 'matcha' as const,
      stamps: 3,
      mode: 'machine' as const,
      seenGuide: true,
      lastReceipt: { number: 1, items: [], value: 0, spent: 0, coupon: null, stampsEarned: 1, printedAt: 0 },
    };
    expect(parseSave(serializeSave(state), 2000)).toEqual({ ...state, lastReceipt: null });
  });

  it('starts fresh from unreadable data', () => {
    expect(parseSave('{not json', 5)).toEqual(createInitialState(5));
    expect(parseSave('[1,2,3]', 5)).toEqual(createInitialState(5));
    expect(parseSave(null, 5)).toEqual(createInitialState(5));
  });

  it('loads carts saved before items cost coins, with nothing to refund', () => {
    const legacy = JSON.stringify({
      cart: [{ id: 3, title: 'Jacket', price: 55.99, description: '', category: '', image: 'https://example.com/j.png', amount: 2 }],
    });
    expect(parseSave(legacy, 0).cart).toEqual([expect.objectContaining({ id: 3, amount: 2, paid: 0 })]);
    expect(parseSave(legacy, 0).seenGuide).toBe(false);
  });

  it('turns the best spare coupon from an older save into the active one', () => {
    expect(parseSave(JSON.stringify({ coupons: ['coupon5', 'coupon20', 'coupon10'] }), 0).appliedCoupon).toBe('coupon20');
    expect(parseSave(JSON.stringify({ coupons: ['coupon20'], appliedCoupon: 'coupon5' }), 0).appliedCoupon).toBe('coupon5');
  });

  it('drops tampered values instead of trusting them', () => {
    const tampered = JSON.stringify({
      coins: -50,
      cart: [{ id: 1, title: 'x', price: 1, description: '', category: '', image: 'javascript:alert(1)', amount: 1 }],
      perks: { vibes: 9999, thumb: 'lots' },
      ownedThemes: ['sunny', 'gold-plated'],
      theme: 'midnight',
      coupons: ['coupon99'],
      appliedCoupon: 'coupon99',
      lastTickAt: 10_000,
    });
    const state = parseSave(tampered, 500);
    expect(state.coins).toBe(STARTING_COINS);
    expect(state.cart).toEqual([]);
    expect(state.perks).toEqual({ vibes: 20, thumb: 0, hopper: 0 });
    expect(state.ownedThemes).toEqual(['sunny']);
    expect(state.theme).toBe('sunny');
    expect(state.appliedCoupon).toBeNull();
    expect(state.lastTickAt).toBe(500);
  });
});
