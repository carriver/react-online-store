export type Product = {
  id: number;
  category: string;
  description: string;
  image: string;
  price: number;
  title: string;
};

// `paid` is what the player actually spent on this line, so a refund returns exactly that.
export type CartItemType = Product & { amount: number; paid: number };

export const addToCart = (cartItems: CartItemType[], product: Product, cost: number): CartItemType[] =>
  cartItems.some((item) => item.id === product.id)
    ? cartItems.map((item) => (item.id === product.id ? { ...item, amount: item.amount + 1, paid: item.paid + cost } : item))
    : [...cartItems, { ...product, amount: 1, paid: cost }];

export const refundForOne = (item: CartItemType) => (item.amount === 1 ? item.paid : Math.round(item.paid / item.amount));

export const removeOneFromCart = (cartItems: CartItemType[], productId: number): CartItemType[] =>
  cartItems.flatMap((item) => {
    if (item.id !== productId) return [item];
    return item.amount > 1 ? [{ ...item, amount: item.amount - 1, paid: item.paid - refundForOne(item) }] : [];
  });

export const countItems = (cartItems: CartItemType[]) =>
  cartItems.reduce((count, item) => count + item.amount, 0);

export const amountOwned = (cartItems: CartItemType[], productId: number) =>
  cartItems.find((item) => item.id === productId)?.amount ?? 0;
