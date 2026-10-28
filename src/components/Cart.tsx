import React from 'react';

import { cartTotal, type CartItemType, type Product } from '../cart';
import Wrapper from './Cart.styles';
import CartItem from './CartItem';

type Props = {
  cartItems: CartItemType[];
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
};

const Cart: React.FC<Props> = ({ cartItems, addToCart, removeFromCart }) => {
  return (
    <Wrapper>
      <h2>Your Shopping Cart</h2>
      {cartItems.length === 0 ? <p>No items in cart.</p> : null}
      {cartItems.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      ))}
      <h2>Total: ${cartTotal(cartItems).toFixed(2)}</h2>
    </Wrapper>
  );
};

export default Cart;
