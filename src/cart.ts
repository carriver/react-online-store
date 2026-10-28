export type Product = {
  id: number;
  category: string;
  description: string;
  image: string;
  price: number;
  title: string;
};

export type CartItemType = Product & { amount: number };

export const addToCart = (cartItems: CartItemType[], product: Product): CartItemType[] =>
  cartItems.some((item) => item.id === product.id)
    ? cartItems.map((item) => (item.id === product.id ? { ...item, amount: item.amount + 1 } : item))
    : [...cartItems, { ...product, amount: 1 }];

export const removeOneFromCart = (cartItems: CartItemType[], productId: number): CartItemType[] =>
  cartItems.flatMap((item) => {
    if (item.id !== productId) return [item];
    return item.amount > 1 ? [{ ...item, amount: item.amount - 1 }] : [];
  });

export const countItems = (cartItems: CartItemType[]) =>
  cartItems.reduce((count, item) => count + item.amount, 0);

export const cartTotal = (cartItems: CartItemType[]) =>
  cartItems.reduce((total, item) => total + item.amount * item.price, 0);
