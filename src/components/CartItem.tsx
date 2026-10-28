import { Button } from '@mui/material';
import React from 'react';

import type { CartItemType, Product } from '../cart';
import Wrapper from './CartItem.styles';

type Props = {
  item: CartItemType;
  addToCart: (product: Product) => void;
  removeFromCart: (id: number) => void;
};

const CartItem: React.FC<Props> = ({ item, addToCart, removeFromCart }) => (
  <Wrapper>
    <div>
      <h3>{item.title}</h3>
      <div className='information'>
        <p>Price: ${item.price}</p>
        <p>Total: ${(item.amount * item.price).toFixed(2)}</p>
      </div>
      <div className='buttons'>
        <Button
          size='small'
          color='inherit'
          disableElevation
          variant='contained'
          onClick={() => removeFromCart(item.id)}>
          -
        </Button>
        <p>{item.amount}</p>
        <Button
          size='small'
          color='inherit'
          disableElevation
          variant='contained'
          onClick={() => addToCart(item)}>
          +
        </Button>
      </div>
    </div>
    <img src={item.image} alt={item.title} />
  </Wrapper>
);

export default CartItem;
