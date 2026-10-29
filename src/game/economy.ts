import type { CartItemType, Product } from '../cart';

export type PerkId = 'vibes' | 'thumb' | 'hopper';
export type CouponId = 'coupon5' | 'coupon10' | 'coupon20';
export type ThemeId = 'sunny' | 'midnight' | 'matcha';

export const BASE_INCOME_PER_SECOND = 0.5;
export const VIBES_BONUS_PER_LEVEL = 0.25;
export const STAMP_BONUS = 0.1;
export const BASE_OFFLINE_HOURS = 1;
export const MAX_HOPPER_LEVEL = 7;
export const STAMP_VALUE_SCALE = 10;
export const STARTING_COINS = 20;
export const COPY_PRICE_GROWTH = 1.15;

export const PERKS: Record<PerkId, { name: string; blurb: string; baseCost: number; growth: number; maxLevel: number }> = {
  vibes: { name: 'Cozier vibes', blurb: '+25% income per level', baseCost: 50, growth: 1.6, maxLevel: 20 },
  thumb: { name: 'Stronger thumb', blurb: '+1 coin per tap or shake', baseCost: 25, growth: 1.5, maxLevel: 20 },
  hopper: { name: 'Deeper hopper', blurb: '+1 hour of earnings while away', baseCost: 100, growth: 2, maxLevel: MAX_HOPPER_LEVEL },
};

export const COUPONS: Record<CouponId, { name: string; percentOff: number; cost: number }> = {
  coupon5: { name: '5% off', percentOff: 5, cost: 150 },
  coupon10: { name: '10% off', percentOff: 10, cost: 600 },
  coupon20: { name: '20% off', percentOff: 20, cost: 2500 },
};

export const THEMES: Record<ThemeId, { name: string; cost: number }> = {
  sunny: { name: 'Sunny', cost: 0 },
  midnight: { name: 'Midnight', cost: 300 },
  matcha: { name: 'Matcha', cost: 300 },
};

// Square root keeps a $999 drive from dwarfing a $7 ring: the cheap things still feel worth owning.
export const itemYieldPerSecond = (price: number) => Math.round((0.2 + Math.sqrt(price) / 5) * 10) / 10;

export const basePrice = (product: Pick<Product, 'price'>) => Math.ceil(product.price);

// Each extra copy costs more, or buying the cheapest shirt fifty times would outrun every other choice.
export const listPrice = (product: Pick<Product, 'price'>, owned: number) => Math.ceil(basePrice(product) * COPY_PRICE_GROWTH ** owned);

// At least one coin off, so a coupon never rounds away to nothing on a cheap item.
export const couponDiscount = (price: number, coupon: CouponId | null) =>
  coupon ? Math.max(1, Math.round((price * COUPONS[coupon].percentOff) / 100)) : 0;

export const itemCost = (product: Pick<Product, 'price'>, owned: number, coupon: CouponId | null) => {
  const price = listPrice(product, owned);
  return price - couponDiscount(price, coupon);
};

export const isCouponUpgrade = (coupon: CouponId, active: CouponId | null) =>
  active === null || COUPONS[coupon].percentOff > COUPONS[active].percentOff;

export const cartValue = (cartItems: CartItemType[]) => cartItems.reduce((total, item) => total + item.amount * basePrice(item), 0);

export const incomeMultiplier = (vibesLevel: number, stamps: number) =>
  (1 + VIBES_BONUS_PER_LEVEL * vibesLevel) * (1 + STAMP_BONUS * stamps);

export const incomePerSecond = (cartItems: CartItemType[], vibesLevel: number, stamps: number) =>
  (BASE_INCOME_PER_SECOND + cartItems.reduce((sum, item) => sum + item.amount * itemYieldPerSecond(item.price), 0)) *
  incomeMultiplier(vibesLevel, stamps);

export const coinsPerTap = (thumbLevel: number) => 1 + thumbLevel;

export const perkCost = (perk: PerkId, level: number) =>
  Math.round(PERKS[perk].baseCost * PERKS[perk].growth ** level);

export const offlineCapSeconds = (hopperLevel: number) => (BASE_OFFLINE_HOURS + hopperLevel) * 3600;

export const offlineEarnings = (elapsedSeconds: number, ratePerSecond: number, hopperLevel: number) =>
  Math.floor(Math.min(Math.max(elapsedSeconds, 0), offlineCapSeconds(hopperLevel)) * ratePerSecond);

// Square root again: a big haul should feel rewarding without one checkout breaking the economy.
export const stampsForCheckout = (value: number) => Math.max(1, Math.floor(Math.sqrt(value / STAMP_VALUE_SCALE)));
