import { describe, expect, it } from 'vitest';
import {
  discountedTotal,
  incomePerSecond,
  itemYieldPerSecond,
  offlineEarnings,
  perkCost,
  stampsForCheckout,
} from './economy';

const item = (price: number, amount = 1) => ({ id: price, title: '', description: '', category: '', image: '', price, amount });

describe('economy', () => {
  it('pays more for pricier items, but with diminishing returns', () => {
    expect(itemYieldPerSecond(999.99)).toBeGreaterThan(itemYieldPerSecond(9.99));
    expect(itemYieldPerSecond(999.99) / itemYieldPerSecond(9.99)).toBeLessThan(10);
  });

  it('adds the base income to every owned item and applies vibes and stamps', () => {
    const cart = [item(100, 2)];
    const plain = incomePerSecond(cart, 0, 0);
    expect(plain).toBeCloseTo(0.5 + 2 * itemYieldPerSecond(100));
    expect(incomePerSecond(cart, 2, 0)).toBeCloseTo(plain * 1.5);
    expect(incomePerSecond(cart, 0, 3)).toBeCloseTo(plain * 1.3);
  });

  it('grows perk prices with each level', () => {
    expect(perkCost('vibes', 0)).toBe(50);
    expect(perkCost('vibes', 1)).toBe(80);
    expect(perkCost('vibes', 5)).toBeGreaterThan(perkCost('vibes', 4));
  });

  it('caps time away by the hopper size', () => {
    expect(offlineEarnings(600, 2, 0)).toBe(1200);
    expect(offlineEarnings(10 * 3600, 1, 0)).toBe(3600);
    expect(offlineEarnings(10 * 3600, 1, 2)).toBe(3 * 3600);
  });

  it('always awards at least one stamp and scales stamps sub-linearly', () => {
    expect(stampsForCheckout(5)).toBe(1);
    expect(stampsForCheckout(160)).toBe(4);
    expect(stampsForCheckout(2000)).toBe(14);
  });

  it('applies coupon discounts to the total', () => {
    expect(discountedTotal(200, null)).toBe(200);
    expect(discountedTotal(200, 'coupon10')).toBeCloseTo(180);
  });
});
