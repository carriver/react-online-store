import { describe, expect, it } from 'vitest';
import { addToCart, cartTotal, countItems, removeOneFromCart, type Product } from './cart';

const backpack: Product = { id: 1, title: 'Backpack', price: 109.95, description: '', category: '', image: '' };
const shirt: Product = { id: 2, title: 'Shirt', price: 22.3, description: '', category: '', image: '' };

describe('cart', () => {
  it('adds a new product with an amount of one', () => {
    expect(addToCart([], backpack)).toEqual([{ ...backpack, amount: 1 }]);
  });

  it('increments the amount when the product is already in the cart', () => {
    const cart = addToCart(addToCart([], backpack), backpack);
    expect(cart).toEqual([{ ...backpack, amount: 2 }]);
  });

  it('decrements the amount and drops the product at zero', () => {
    const cart = addToCart(addToCart(addToCart([], backpack), backpack), shirt);

    expect(removeOneFromCart(cart, backpack.id)).toEqual([{ ...backpack, amount: 1 }, { ...shirt, amount: 1 }]);
    expect(removeOneFromCart(cart, shirt.id)).toEqual([{ ...backpack, amount: 2 }]);
  });

  it('counts items and totals prices across products', () => {
    const cart = addToCart(addToCart(addToCart([], backpack), backpack), shirt);

    expect(countItems(cart)).toBe(3);
    expect(cartTotal(cart)).toBeCloseTo(242.2);
  });

  it('does not mutate the cart it was given', () => {
    const cart = Object.freeze([Object.freeze({ ...backpack, amount: 1 })]);
    expect(() => addToCart(cart as never, backpack)).not.toThrow();
    expect(cart[0].amount).toBe(1);
  });
});
