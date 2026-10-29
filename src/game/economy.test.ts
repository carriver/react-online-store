import { describe, expect, it } from 'vitest';
import {
  cartValue,
  incomePerSecond,
  isCouponUpgrade,
  itemCost,
  itemYieldPerSecond,
  offlineEarnings,
  perkCost,
  stampsForCheckout,
} from './economy';

const item = (price: number, amount = 1) => ({ id: price, title: '', description: '', category: '', image: '', price, amount, paid: 0 });

describe('economy', () => {
  it('makes every item pay for itself in about a minute, pricier ones a little faster', () => {
    const paybackSeconds = (price: number) => Math.ceil(price) / itemYieldPerSecond(price);
    expect(paybackSeconds(22.3)).toBeGreaterThan(45);
    expect(paybackSeconds(22.3)).toBeLessThan(90);
    expect(paybackSeconds(999.99)).toBeLessThan(paybackSeconds(22.3));
    expect(paybackSeconds(999.99)).toBeGreaterThan(30);
  });

  it('never rounds an item’s earnings down to nothing', () => {
    expect(itemYieldPerSecond(7.95)).toBeGreaterThan(0);
  });

  it('adds the base income to every owned item and applies vibes and stamps', () => {
    const cart = [item(100, 2)];
    const plain = incomePerSecond(cart, 0, 0);
    expect(plain).toBeCloseTo(0.5 + 2 * itemYieldPerSecond(100));
    expect(incomePerSecond(cart, 2, 0)).toBeCloseTo(plain * 1.2);
    expect(incomePerSecond(cart, 0, 3)).toBeCloseTo(plain * 1.3);
  });

  it('grows perk prices with each level', () => {
    expect(perkCost('vibes', 0)).toBe(100);
    expect(perkCost('vibes', 1)).toBe(200);
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

  it('prices items in whole coins, raising the price of every extra copy', () => {
    expect(itemCost({ price: 7.95 }, 0, 0, null)).toBe(8);
    expect(itemCost({ price: 100 }, 1, 1, null)).toBe(119);
    expect(itemCost({ price: 100 }, 5, 5, null)).toBeGreaterThan(itemCost({ price: 100 }, 4, 4, null));
  });

  it('raises every price a little for each item already owned', () => {
    expect(itemCost({ price: 100 }, 0, 10, null)).toBe(135);
    expect(itemCost({ price: 100 }, 0, 10, null)).toBeGreaterThan(itemCost({ price: 100 }, 0, 9, null));
  });

  it('takes an active coupon off the item price', () => {
    expect(itemCost({ price: 200 }, 0, 0, 'coupon10')).toBe(180);
    expect(itemCost({ price: 200 }, 0, 0, 'coupon20')).toBe(160);
  });

  it('always saves at least one coin with a coupon, even on the cheapest item', () => {
    expect(itemCost({ price: 7.95 }, 0, 0, 'coupon5')).toBe(7);
    expect(itemCost({ price: 9.85 }, 0, 0, 'coupon5')).toBe(9);
  });

  it('only lets a bigger coupon replace the active one', () => {
    expect(isCouponUpgrade('coupon5', null)).toBe(true);
    expect(isCouponUpgrade('coupon20', 'coupon5')).toBe(true);
    expect(isCouponUpgrade('coupon5', 'coupon5')).toBe(false);
    expect(isCouponUpgrade('coupon10', 'coupon20')).toBe(false);
  });

  it('values a cart at the base price of each item, whatever was paid', () => {
    expect(cartValue([item(9.5, 2), item(100)])).toBe(120);
  });
});
