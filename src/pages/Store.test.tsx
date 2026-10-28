import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Store from './Store';

const products = [
  { id: 1, title: 'Backpack', price: 10, description: 'Fits a laptop', category: "men's clothing", image: 'https://example.com/backpack.png' },
  { id: 2, title: 'Shirt', price: 11, description: 'Slim fit', category: "women's clothing", image: 'https://example.com/shirt.png' },
];

const respondWith = (response: Partial<Response>) => vi.stubGlobal('fetch', vi.fn(async () => response as Response));

const renderStore = (path = '/store') =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={[path]}>
        <Store />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('Store', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('lists the products from the API in the catalog', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    expect(await screen.findByRole('heading', { name: 'Backpack' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shirt' })).toBeInTheDocument();
    expect(screen.getByLabelText('Collected 0 of 2')).toBeInTheDocument();
  });

  it('moves added products into the room, counts them on the cart and totals them', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Add Backpack to cart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add Backpack to cart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add Shirt to cart' }));
    expect(screen.getByRole('button', { name: 'Cart, 3 items' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /Your room/ })).getByRole('img', { name: 'Backpack' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cart, 3 items' }));
    const cart = screen.getByRole('dialog', { name: 'Your Shopping Cart' });
    expect(within(cart).getByRole('heading', { name: 'Total: $31.00' })).toBeInTheDocument();
  });

  it('checks out into a printed receipt and empties the cart', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Add Shirt to cart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cart, 1 items' }));
    await userEvent.click(screen.getByRole('button', { name: /Check out/ }));

    const receipt = screen.getByRole('dialog', { name: 'Order printed' });
    expect(within(receipt).getByText('1 × Shirt')).toBeInTheDocument();
    await userEvent.click(within(receipt).getByRole('button', { name: 'Back to shopping' }));
    expect(screen.getByRole('button', { name: 'Cart, 0 items' })).toBeInTheDocument();
  });

  it('vends a product typed on the machine keypad into the cart', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore('/store?mode=machine');

    await userEvent.click(await screen.findByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByRole('status')).toHaveTextContent('A2 · $11.00 · PRESS VEND');
    await userEvent.click(screen.getByRole('button', { name: 'VEND' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cart, 1 items' })).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('status')).toHaveTextContent('NEW FIND! ENJOY');
  });

  it('switches between the room and the machine without losing the cart', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Add Backpack to cart' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fake-o-Mat' }));
    expect(await screen.findByRole('group', { name: 'Keypad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cart, 1 items' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fake-o-Mat' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an error message when the API refuses the request', async () => {
    respondWith({ ok: false, status: 403, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderStore();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong loading the products');
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Product request failed with HTTP 403' }));
  });
});
