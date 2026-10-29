import { describe, expect, it } from 'vitest';
import { addToCart, amountOwned, countItems, refundForOne, removeOneFromCart, type Product } from './cart';

const backpack: Product = { id: 1, title: 'Backpack', price: 109.95, description: '', category: '', image: '' };
const shirt: Product = { id: 2, title: 'Shirt', price: 22.3, description: '', category: '', image: '' };

describe('cart', () => {
  it('adds a new product with an amount of one and records what was paid', () => {
    expect(addToCart([], backpack, 110)).toEqual([{ ...backpack, amount: 1, paid: 110 }]);
  });

  it('increments the amount and the total paid when the product is already in the cart', () => {
    const cart = addToCart(addToCart([], backpack, 110), backpack, 127);
    expect(cart).toEqual([{ ...backpack, amount: 2, paid: 237 }]);
  });

  it('decrements the amount, keeps the rest of what was paid, and drops the product at zero', () => {
    const cart = addToCart(addToCart(addToCart([], backpack, 110), backpack, 130), shirt, 23);

    expect(removeOneFromCart(cart, backpack.id)).toEqual([{ ...backpack, amount: 1, paid: 120 }, { ...shirt, amount: 1, paid: 23 }]);
    expect(removeOneFromCart(cart, shirt.id)).toEqual([{ ...backpack, amount: 2, paid: 240 }]);
  });

  it('refunds the average price per copy, and everything left on the last one', () => {
    expect(refundForOne({ ...backpack, amount: 2, paid: 240 })).toBe(120);
    expect(refundForOne({ ...backpack, amount: 1, paid: 99 })).toBe(99);
  });

  it('counts items and finds how many of a product are owned', () => {
    const cart = addToCart(addToCart(addToCart([], backpack, 1), backpack, 1), shirt, 1);

    expect(countItems(cart)).toBe(3);
    expect(amountOwned(cart, backpack.id)).toBe(2);
    expect(amountOwned(cart, 99)).toBe(0);
  });

  it('does not mutate the cart it was given', () => {
    const cart = Object.freeze([Object.freeze({ ...backpack, amount: 1, paid: 110 })]);
    expect(() => addToCart(cart as never, backpack, 120)).not.toThrow();
    expect(cart[0].amount).toBe(1);
  });
});
