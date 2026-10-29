import type { CartItemType } from '../cart';
import { COUPONS, PERKS, THEMES, type CouponId, type PerkId, type ThemeId } from './economy';
import { createInitialState, type GameState } from './state';

export const SAVE_KEY = 'fake-store.save.v1';

type Saved = Omit<GameState, 'lastReceipt'>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const finiteOr = (value: unknown, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

const isKeyOf = <T extends object>(table: T, value: unknown): value is keyof T =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(table, value);

type SavedCartItem = Omit<CartItemType, 'paid'> & { paid?: unknown };

const isCartItem = (value: unknown): value is SavedCartItem =>
  isRecord(value) &&
  Number.isInteger(value.id) &&
  Number.isInteger(value.amount) &&
  (value.amount as number) > 0 &&
  typeof value.price === 'number' &&
  Number.isFinite(value.price) &&
  ['title', 'description', 'category', 'image'].every((field) => typeof value[field] === 'string') &&
  /^https:\/\//.test(value.image as string);

const listOf = <T,>(value: unknown, isValid: (entry: unknown) => entry is T): T[] =>
  Array.isArray(value) ? value.filter(isValid) : [];

export const parseSave = (raw: string | null, now: number): GameState => {
  const initial = createInitialState(now);
  if (!raw) return initial;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return initial;
  }
  if (!isRecord(data)) return initial;

  const perks = isRecord(data.perks) ? data.perks : {};
  const ownedThemes = listOf(data.ownedThemes, (theme): theme is ThemeId => isKeyOf(THEMES, theme));
  const coupons = listOf(data.coupons, (coupon): coupon is CouponId => isKeyOf(COUPONS, coupon));
  const theme = isKeyOf(THEMES, data.theme) && ownedThemes.includes(data.theme) ? data.theme : 'sunny';
  const lastTickAt = finiteOr(data.lastTickAt, now);

  return {
    ...initial,
    coins: finiteOr(data.coins, initial.coins),
    // Saves from before items cost coins hold items that were free, so they refund nothing.
    cart: listOf(data.cart, isCartItem).map((item) => ({ ...item, paid: Math.floor(finiteOr(item.paid, 0)) })),
    discovered: listOf(data.discovered, (id): id is number => Number.isInteger(id)),
    perks: Object.fromEntries(
      (Object.keys(PERKS) as PerkId[]).map((perk) => [
        perk,
        Math.min(Math.floor(finiteOr(perks[perk], 0)), PERKS[perk].maxLevel),
      ]),
    ) as Record<PerkId, number>,
    coupons,
    appliedCoupon: isKeyOf(COUPONS, data.appliedCoupon) ? data.appliedCoupon : null,
    ownedThemes: ownedThemes.includes('sunny') ? ownedThemes : ['sunny', ...ownedThemes],
    theme,
    stamps: Math.floor(finiteOr(data.stamps, 0)),
    receiptsPrinted: Math.floor(finiteOr(data.receiptsPrinted, 0)),
    mode: data.mode === 'machine' ? 'machine' : 'room',
    muted: data.muted === true,
    seenGuide: data.seenGuide === true,
    lastTickAt: Math.min(lastTickAt, now),
    awayEarnings:
      isRecord(data.awayEarnings) && finiteOr(data.awayEarnings.coins, 0) > 0
        ? { coins: finiteOr(data.awayEarnings.coins, 0), seconds: finiteOr(data.awayEarnings.seconds, 0) }
        : null,
  };
};

export const serializeSave = (state: GameState) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lastReceipt, ...saved } = state;
  return JSON.stringify(saved satisfies Saved);
};

export const loadGame = (now: number) => {
  try {
    return parseSave(window.localStorage.getItem(SAVE_KEY), now);
  } catch {
    return createInitialState(now);
  }
};

export const saveGame = (state: GameState) => {
  try {
    window.localStorage.setItem(SAVE_KEY, serializeSave(state));
  } catch (error) {
    console.warn('Could not save game progress', error);
  }
};
