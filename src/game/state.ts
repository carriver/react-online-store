import { addToCart, amountOwned, refundForOne, removeOneFromCart, type CartItemType, type Product } from '../cart';
import {
  COUPONS,
  PERKS,
  STARTING_COINS,
  THEMES,
  cartValue,
  coinsPerTap,
  incomePerSecond,
  isCouponUpgrade,
  itemCost,
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
  value: number;
  spent: number;
  coupon: CouponId | null;
  stampsEarned: number;
  printedAt: number;
};

export type GameState = {
  coins: number;
  cart: CartItemType[];
  discovered: number[];
  perks: Record<PerkId, number>;
  // One coupon at a time: it discounts every purchase until the next checkout, and a bigger one replaces it.
  appliedCoupon: CouponId | null;
  ownedThemes: ThemeId[];
  theme: ThemeId;
  stamps: number;
  receiptsPrinted: number;
  mode: Mode;
  muted: boolean;
  seenGuide: boolean;
  lastTickAt: number;
  awayEarnings: { coins: number; seconds: number } | null;
  lastReceipt: Receipt | null;
};

export type GameAction =
  | { type: 'tick'; now: number }
  | { type: 'tap' }
  | { type: 'buy'; product: Product }
  | { type: 'remove'; productId: number }
  | { type: 'buyPerk'; perk: PerkId }
  | { type: 'buyCoupon'; coupon: CouponId }
  | { type: 'chooseTheme'; theme: ThemeId }
  | { type: 'checkout'; now: number }
  | { type: 'dismissReceipt' }
  | { type: 'collectAwayEarnings' }
  | { type: 'setMode'; mode: Mode }
  | { type: 'toggleMute' }
  | { type: 'closeGuide' };

// The clock pauses in hidden tabs; a gap this long counts as time away and earns the welcome-back payout.
export const AWAY_THRESHOLD_SECONDS = 60;

export const createInitialState = (now: number): GameState => ({
  coins: STARTING_COINS,
  cart: [],
  discovered: [],
  perks: { vibes: 0, thumb: 0, hopper: 0 },
  appliedCoupon: null,
  ownedThemes: ['sunny'],
  theme: 'sunny',
  stamps: 0,
  receiptsPrinted: 0,
  mode: 'room',
  muted: false,
  seenGuide: false,
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

export const nextItemCost = (state: GameState, product: Product) =>
  itemCost(product, amountOwned(state.cart, product.id), state.appliedCoupon);

const buy = (state: GameState, product: Product): GameState => {
  const cost = nextItemCost(state, product);
  const coins = spend(state, cost);
  if (coins === null) return state;
  return {
    ...state,
    coins,
    cart: addToCart(state.cart, product, cost),
    discovered: state.discovered.includes(product.id) ? state.discovered : [...state.discovered, product.id],
  };
};

const remove = (state: GameState, productId: number): GameState => {
  const item = state.cart.find((entry) => entry.id === productId);
  return item ? { ...state, coins: state.coins + refundForOne(item), cart: removeOneFromCart(state.cart, productId) } : state;
};

const buyPerk = (state: GameState, perk: PerkId): GameState => {
  const level = state.perks[perk];
  const coins = level < PERKS[perk].maxLevel ? spend(state, perkCost(perk, level)) : null;
  return coins === null ? state : { ...state, coins, perks: { ...state.perks, [perk]: level + 1 } };
};

const buyCoupon = (state: GameState, coupon: CouponId): GameState => {
  const coins = isCouponUpgrade(coupon, state.appliedCoupon) ? spend(state, COUPONS[coupon].cost) : null;
  return coins === null ? state : { ...state, coins, appliedCoupon: coupon };
};

const chooseTheme = (state: GameState, theme: ThemeId): GameState => {
  if (state.ownedThemes.includes(theme)) return { ...state, theme };
  const coins = spend(state, THEMES[theme].cost);
  return coins === null ? state : { ...state, coins, theme, ownedThemes: [...state.ownedThemes, theme] };
};

const checkout = (state: GameState, now: number): GameState => {
  if (state.cart.length === 0) return state;
  const value = cartValue(state.cart);
  const stampsEarned = stampsForCheckout(value);
  const receipt: Receipt = {
    number: state.receiptsPrinted + 1,
    items: state.cart,
    value,
    spent: state.cart.reduce((total, item) => total + item.paid, 0),
    coupon: state.appliedCoupon,
    stampsEarned,
    printedAt: now,
  };
  return {
    ...state,
    cart: [],
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
    case 'buy':
      return buy(state, action.product);
    case 'remove':
      return remove(state, action.productId);
    case 'buyPerk':
      return buyPerk(state, action.perk);
    case 'buyCoupon':
      return buyCoupon(state, action.coupon);
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
    case 'closeGuide':
      return { ...state, seenGuide: true };
  }
};
