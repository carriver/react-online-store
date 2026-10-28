import { describe, expect, it } from 'vitest';
import { parseSave, serializeSave } from './persistence';
import { createInitialState } from './state';

describe('persistence', () => {
  it('round-trips a saved game, without the receipt on screen', () => {
    const state = {
      ...createInitialState(1000),
      coins: 1234.5,
      cart: [{ id: 3, title: 'Jacket', price: 55.99, description: '', category: "men's clothing", image: 'https://example.com/j.png', amount: 2 }],
      discovered: [3],
      perks: { vibes: 2, thumb: 1, hopper: 0 },
      coupons: ['coupon5' as const],
      appliedCoupon: 'coupon5' as const,
      ownedThemes: ['sunny' as const, 'matcha' as const],
      theme: 'matcha' as const,
      stamps: 3,
      mode: 'machine' as const,
      lastReceipt: { number: 1, items: [], subtotal: 0, coupon: null, total: 0, stampsEarned: 1, printedAt: 0 },
    };
    expect(parseSave(serializeSave(state), 2000)).toEqual({ ...state, lastReceipt: null });
  });

  it('starts fresh from unreadable data', () => {
    expect(parseSave('{not json', 5)).toEqual(createInitialState(5));
    expect(parseSave('[1,2,3]', 5)).toEqual(createInitialState(5));
    expect(parseSave(null, 5)).toEqual(createInitialState(5));
  });

  it('drops tampered values instead of trusting them', () => {
    const tampered = JSON.stringify({
      coins: -50,
      cart: [{ id: 1, title: 'x', price: 1, description: '', category: '', image: 'javascript:alert(1)', amount: 1 }],
      perks: { vibes: 9999, thumb: 'lots' },
      ownedThemes: ['sunny', 'gold-plated'],
      theme: 'midnight',
      coupons: ['coupon99'],
      appliedCoupon: 'coupon20',
      lastTickAt: 10_000,
    });
    const state = parseSave(tampered, 500);
    expect(state.coins).toBe(0);
    expect(state.cart).toEqual([]);
    expect(state.perks).toEqual({ vibes: 20, thumb: 0, hopper: 0 });
    expect(state.ownedThemes).toEqual(['sunny']);
    expect(state.theme).toBe('sunny');
    expect(state.coupons).toEqual([]);
    expect(state.appliedCoupon).toBeNull();
    expect(state.lastTickAt).toBe(500);
  });
});
