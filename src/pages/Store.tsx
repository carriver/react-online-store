import { Badge, CircularProgress, Drawer, Grid } from '@mui/material';
import { AddShoppingCart as AddShoppingCartIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Nav, Span, StyledButton, Wrapper } from './Store.styles';
import Cart from '../components/Cart';
import Item from '../components/Item';
import { addToCart, countItems, removeOneFromCart, type CartItemType, type Product } from '../cart';
import { Link } from 'react-router';

const getProducts = async (): Promise<Product[]> =>
  await (await fetch('https://fakestoreapi.com/products')).json();

function Store() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const { data, isPending, error } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
  const handleAddToCart = (product: Product) => setCartItems((items) => addToCart(items, product));
  const handleRemoveFromCart = (productId: number) =>
    setCartItems((items) => removeOneFromCart(items, productId));

  if (isPending) return <CircularProgress />;
  if (error) return <div>Something went wrong ...</div>;

  return (
    <div>
      <Nav>
        <StyledButton onClick={() => setCartOpen(true)}>
          <Badge badgeContent={countItems(cartItems)} color='error'>
            <AddShoppingCartIcon />
          </Badge>
        </StyledButton>
        <Link to='/'>
          <Span>HOME</Span>
        </Link>
      </Nav>
      <Wrapper>
        <Drawer
          anchor='right'
          open={cartOpen}
          onClose={() => setCartOpen(false)}>
          <Cart
            cartItems={cartItems}
            addToCart={handleAddToCart}
            removeFromCart={handleRemoveFromCart}
          />
        </Drawer>
        <Grid container spacing={3}>
          {data?.map((item) => (
            <Grid key={item.id} size={{ xs: 12, sm: 4 }}>
              <Item item={item} handleAddToCart={handleAddToCart} />
            </Grid>
          ))}
        </Grid>
      </Wrapper>
    </div>
  );
}

export default Store;
