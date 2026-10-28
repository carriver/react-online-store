import { addToCart, cartTotal, removeOneFromCart, type CartItemType, type Product } from '../cart';
import {
  COUPONS,
  PERKS,
  THEMES,
  coinsPerTap,
  discountedTotal,
  discoveryBonus,
  incomePerSecond,
  offlineEarnings,
  perkCost,
  stampsForCheckout,
  type CouponId,
  type PerkId,
  type ThemeId,
} from './economy';

export type Mode = 'room' | 'machine';

export type Receipt = {
  number: number;
  items: CartItemType[];
  subtotal: number;
  coupon: CouponId | null;
  total: number;
  stampsEarned: number;
  printedAt: number;
};

export type GameState = {
  coins: number;
  cart: CartItemType[];
  discovered: number[];
  perks: Record<PerkId, number>;
  coupons: CouponId[];
  appliedCoupon: CouponId | null;
  ownedThemes: ThemeId[];
  theme: ThemeId;
  stamps: number;
  receiptsPrinted: number;
  mode: Mode;
  muted: boolean;
  lastTickAt: number;
  awayEarnings: { coins: number; seconds: number } | null;
  lastReceipt: Receipt | null;
};

export type GameAction =
  | { type: 'tick'; now: number }
  | { type: 'tap' }
  | { type: 'add'; product: Product }
  | { type: 'remove'; productId: number }
  | { type: 'buyPerk'; perk: PerkId }
  | { type: 'buyCoupon'; coupon: CouponId }
  | { type: 'applyCoupon'; coupon: CouponId | null }
  | { type: 'chooseTheme'; theme: ThemeId }
  | { type: 'checkout'; now: number }
  | { type: 'dismissReceipt' }
  | { type: 'collectAwayEarnings' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'toggleMute' };

// The clock pauses in hidden tabs; a gap this long counts as time away and earns the welcome-back payout.
export const AWAY_THRESHOLD_SECONDS = 60;

export const createInitialState = (now: number): GameState => ({
  coins: 0,
  cart: [],
  discovered: [],
  perks: { vibes: 0, thumb: 0, hopper: 0 },
  coupons: [],
  appliedCoupon: null,
  ownedThemes: ['sunny'],
  theme: 'sunny',
  stamps: 0,
  receiptsPrinted: 0,
  mode: 'room',
  muted: false,
  lastTickAt: now,
  awayEarnings: null,
  lastReceipt: null,
});

export const currentIncome = (state: GameState) => incomePerSecond(state.cart, state.perks.vibes, state.stamps);

const spend = (state: GameState, cost: number) => (state.coins >= cost ? state.coins - cost : null);

const tick = (state: GameState, now: number): GameState => {
  const elapsedSeconds = (now - state.lastTickAt) / 1000;
  if (elapsedSeconds <= 0) return state;
  if (elapsedSeconds < AWAY_THRESHOLD_SECONDS) {
    return { ...state, coins: state.coins + elapsedSeconds * currentIncome(state), lastTickAt: now };
  }
  const earned = offlineEarnings(elapsedSeconds, currentIncome(state), state.perks.hopper);
  const awayEarnings =
    earned > 0
      ? { coins: (state.awayEarnings?.coins ?? 0) + earned, seconds: (state.awayEarnings?.seconds ?? 0) + elapsedSeconds }
      : state.awayEarnings;
  return { ...state, awayEarnings, lastTickAt: now };
};

const add = (state: GameState, product: Product): GameState => {
  const isFirstFind = !state.discovered.includes(product.id);
  return {
    ...state,
    cart: addToCart(state.cart, product),
    discovered: isFirstFind ? [...state.discovered, product.id] : state.discovered,
    coins: isFirstFind ? state.coins + discoveryBonus(product) : state.coins,
  };
};

const buyPerk = (state: GameState, perk: PerkId): GameState => {
  const level = state.perks[perk];
  const coins = level < PERKS[perk].maxLevel ? spend(state, perkCost(perk, level)) : null;
  return coins === null ? state : { ...state, coins, perks: { ...state.perks, [perk]: level + 1 } };
};

const buyCoupon = (state: GameState, coupon: CouponId): GameState => {
  const coins = spend(state, COUPONS[coupon].cost);
  return coins === null ? state : { ...state, coins, coupons: [...state.coupons, coupon], appliedCoupon: coupon };
};

const chooseTheme = (state: GameState, theme: ThemeId): GameState => {
  if (state.ownedThemes.includes(theme)) return { ...state, theme };
  const coins = spend(state, THEMES[theme].cost);
  return coins === null ? state : { ...state, coins, theme, ownedThemes: [...state.ownedThemes, theme] };
};

const withoutOne = <T,>(list: T[], value: T) => {
  const index = list.indexOf(value);
  return index === -1 ? list : [...list.slice(0, index), ...list.slice(index + 1)];
};

const checkout = (state: GameState, now: number): GameState => {
  if (state.cart.length === 0) return state;
  const subtotal = cartTotal(state.cart);
  const total = discountedTotal(subtotal, state.appliedCoupon);
  const stampsEarned = stampsForCheckout(total);
  const receipt: Receipt = {
    number: state.receiptsPrinted + 1,
    items: state.cart,
    subtotal,
    coupon: state.appliedCoupon,
    total,
    stampsEarned,
    printedAt: now,
  };
  const coupons = state.appliedCoupon ? withoutOne(state.coupons, state.appliedCoupon) : state.coupons;
  return {
    ...state,
    cart: [],
    coupons,
    appliedCoupon: null,
    stamps: state.stamps + stampsEarned,
    receiptsPrinted: receipt.number,
    lastReceipt: receipt,
  };
};

export const gameReducer = (state: GameState, action: GameAction): GameState => {
  switch (action.type) {
    case 'tick':
      return tick(state, action.now);
    case 'tap':
      return { ...state, coins: state.coins + coinsPerTap(state.perks.thumb) };
    case 'add':
      return add(state, action.product);
    case 'remove':
      return { ...state, cart: removeOneFromCart(state.cart, action.productId) };
    case 'buyPerk':
      return buyPerk(state, action.perk);
    case 'buyCoupon':
      return buyCoupon(state, action.coupon);
    case 'applyCoupon':
      return action.coupon === null || state.coupons.includes(action.coupon)
        ? { ...state, appliedCoupon: action.coupon }
        : state;
    case 'chooseTheme':
      return chooseTheme(state, action.theme);
    case 'checkout':
      return checkout(state, action.now);
    case 'dismissReceipt':
      return { ...state, lastReceipt: null };
    case 'collectAwayEarnings':
      return state.awayEarnings
        ? { ...state, coins: state.coins + state.awayEarnings.coins, awayEarnings: null }
        : state;
    case 'setMode':
      return { ...state, mode: action.mode };
    case 'toggleMute':
      return { ...state, muted: !state.muted };
  }
};
