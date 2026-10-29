import { describe, expect, it } from 'vitest';
import { formatCoins, formatCoinsPerSecond, machineCode, machineRows, roomSlots } from './catalog';

const product = (id: number, category: string) => ({ id, category, title: '', description: '', price: 1, image: '' });

describe('catalog', () => {
  it('labels vending slots row by row', () => {
    expect([0, 4, 5, 19].map(machineCode)).toEqual(['A1', 'A5', 'B1', 'D5']);
    expect(machineRows(20)).toEqual(['A', 'B', 'C', 'D']);
    expect(machineRows(21)).toEqual(['A', 'B', 'C', 'D', 'E']);
  });

  it('gives every product a stable spot in its zone, regardless of list order', () => {
    const products = [product(2, 'jewelery'), product(1, "men's clothing"), product(3, 'electronics'), product(4, 'toys')];
    const slots = roomSlots(products);
    expect(slots.get(1)?.zone).toBe('rail');
    expect(slots.get(2)?.zone).toBe('shelf');
    expect(slots.get(3)?.zone).toBe('desk');
    expect(slots.get(4)?.zone).toBe('floor');
    expect(roomSlots([...products].reverse())).toEqual(slots);
  });

  it('overflows a full zone onto the floor', () => {
    const rings = Array.from({ length: 5 }, (_, index) => product(index + 1, 'jewelery'));
    expect(roomSlots(rings).get(5)?.zone).toBe('floor');
  });

  it('names the unit when showing what something earns per second', () => {
    expect(formatCoinsPerSecond(2.34)).toBe('2.3 coins/sec');
    expect(formatCoinsPerSecond(1500)).toBe('1,500 coins/sec');
  });

  it('abbreviates coin counts only once they get large', () => {
    expect(formatCoins(12_345.9)).toBe('12,345');
    expect(formatCoins(2_500_000)).toBe('2.5M');
  });
});
