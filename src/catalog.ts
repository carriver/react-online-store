import type { Product } from './cart';

export type Zone = 'rail' | 'shelf' | 'desk' | 'floor';
export type RoomSlot = { zone: Zone; x: number; y: number; tilt: number };

const CATEGORY_LABELS: Record<string, string> = {
  electronics: 'Gadgets',
  jewelery: 'Jewelry',
  "men's clothing": 'Menswear',
  "women's clothing": 'Womenswear',
};

const CATEGORY_ZONES: Record<string, Zone> = {
  electronics: 'desk',
  jewelery: 'shelf',
  "men's clothing": 'rail',
  "women's clothing": 'rail',
};

export const categoryLabel = (category: string) => CATEGORY_LABELS[category] ?? category;

// Anchor points in the room's 800 x 560 drawing, in the order a zone fills up.
const ZONE_ANCHORS: Record<Zone, { x: number; y: number }[]> = {
  rail: Array.from({ length: 10 }, (_, index) => ({ x: 68 + index * 35.5, y: 226 })),
  shelf: [
    { x: 562, y: 170 },
    { x: 622, y: 170 },
    { x: 682, y: 170 },
    { x: 742, y: 170 },
  ],
  desk: [
    { x: 530, y: 340 },
    { x: 603, y: 340 },
    { x: 676, y: 340 },
    { x: 749, y: 340 },
    { x: 575, y: 270 },
    { x: 690, y: 270 },
  ],
  floor: [
    { x: 540, y: 486 },
    { x: 610, y: 486 },
    { x: 680, y: 486 },
    { x: 750, y: 486 },
    { x: 150, y: 520 },
    { x: 80, y: 520 },
  ],
};

const tiltFor = (productId: number) => ((productId * 37) % 9) - 4;

// Products keep the same spot in the room for as long as the catalog does, so the room
// reads like a place being furnished rather than a list being re-sorted.
export const roomSlots = (products: Product[]): Map<number, RoomSlot> => {
  const used: Record<Zone, number> = { rail: 0, shelf: 0, desk: 0, floor: 0 };
  const slots = new Map<number, RoomSlot>();
  [...products]
    .sort((left, right) => left.id - right.id)
    .forEach((product) => {
      const preferred = CATEGORY_ZONES[product.category] ?? 'floor';
      const zone = used[preferred] < ZONE_ANCHORS[preferred].length ? preferred : 'floor';
      const anchor = ZONE_ANCHORS[zone][used[zone] % ZONE_ANCHORS[zone].length];
      used[zone] += 1;
      slots.set(product.id, { zone, ...anchor, tilt: tiltFor(product.id) });
    });
  return slots;
};

export const MACHINE_COLUMNS = 5;
const ROW_LETTERS = 'ABCDEFGH';

export const machineCode = (index: number) =>
  `${ROW_LETTERS[Math.floor(index / MACHINE_COLUMNS)]}${(index % MACHINE_COLUMNS) + 1}`;

export const machineRows = (productCount: number) =>
  ROW_LETTERS.slice(0, Math.min(Math.ceil(productCount / MACHINE_COLUMNS), ROW_LETTERS.length)).split('');

export const formatCoins = (coins: number) => {
  const whole = Math.floor(coins);
  return whole < 100_000
    ? whole.toLocaleString('en-US')
    : new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(whole);
};

export const formatRate = (perSecond: number) => `+${perSecond < 100 ? perSecond.toFixed(1) : formatCoins(perSecond)}/s`;

export const formatMoney = (dollars: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(dollars);

export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return 'a moment';
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
