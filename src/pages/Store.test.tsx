import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Store from './Store';

const products = [
  { id: 1, title: 'Backpack', price: 10, description: 'Fits a laptop', category: 'bags', image: 'backpack.png' },
  { id: 2, title: 'Shirt', price: 11, description: 'Slim fit', category: 'clothing', image: 'shirt.png' },
];

const respondWith = (response: Partial<Response>) =>
  vi.stubGlobal('fetch', vi.fn(async () => response as Response));

const renderStore = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <Store />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('Store', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists the products from the API', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    expect(await screen.findByRole('heading', { name: 'Backpack' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shirt' })).toBeInTheDocument();
  });

  it('counts added products on the cart badge and totals them in the cart', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();
    const addButtons = await screen.findAllByRole('button', { name: /add to cart/i });

    await userEvent.click(addButtons[0]);
    await userEvent.click(addButtons[0]);
    await userEvent.click(addButtons[1]);
    expect(document.querySelector('.MuiBadge-badge')).toHaveTextContent('3');

    await userEvent.click(document.querySelector('.MuiBadge-root')!);
    const cart = await screen.findByRole('heading', { name: 'Your Shopping Cart' });
    expect(within(cart.parentElement!).getByRole('heading', { name: 'Total: $31.00' })).toBeInTheDocument();
  });

  it('shows an error message when the API refuses the request', async () => {
    respondWith({ ok: false, status: 403, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderStore();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong loading the products');
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Product request failed with HTTP 403' }));
  });
});
