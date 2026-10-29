import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SAVE_KEY } from '../game/persistence';
import Store from './Store';

const products = [
  { id: 1, title: 'Backpack', price: 10, description: 'Fits a laptop', category: "men's clothing", image: 'https://example.com/backpack.png' },
  { id: 2, title: 'Shirt', price: 11, description: 'Slim fit', category: "women's clothing", image: 'https://example.com/shirt.png' },
  { id: 3, title: 'Watch', price: 50, description: 'Tells time', category: 'electronics', image: 'https://example.com/watch.png' },
];

const startWith = (save: Record<string, unknown>) => window.localStorage.setItem(SAVE_KEY, JSON.stringify({ seenGuide: true, ...save }));

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

  it('lists the products from the API in the catalog with their coin prices', async () => {
    startWith({});
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    expect(await screen.findByRole('heading', { name: 'Backpack' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Shirt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buy Backpack for 10 coins' })).toBeEnabled();
    expect(screen.getByLabelText('Collected 0 of 3')).toBeInTheDocument();
  });

  it('explains how to play on the first visit only, and again from the help button', async () => {
    respondWith({ ok: true, status: 200, json: async () => products });
    const { unmount } = renderStore();

    const guide = await screen.findByRole('dialog', { name: 'How to play' });
    expect(within(guide).getByRole('heading', { name: 'Earn coins' })).toBeInTheDocument();
    await userEvent.click(within(guide).getByRole('button', { name: 'Let’s shop' }));
    expect(screen.queryByRole('dialog', { name: 'How to play' })).not.toBeInTheDocument();

    unmount();
    renderStore();
    await screen.findByRole('heading', { name: 'Backpack' });
    expect(screen.queryByRole('dialog', { name: 'How to play' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'How to play' }));
    expect(screen.getByRole('dialog', { name: 'How to play' })).toBeInTheDocument();
  });

  it('spends coins on items, which move into the room and raise the price of the next copy', async () => {
    startWith({ coins: 100 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Buy Backpack for 10 coins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Buy Backpack for 12 coins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Buy Shirt for 11 coins' }));
    expect(screen.getByRole('button', { name: 'Cart, 3 items' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: /Your room/ })).getByRole('img', { name: 'Backpack' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cart, 3 items' }));
    const cart = screen.getByRole('dialog', { name: 'Your Shopping Cart' });
    expect(within(cart).getByText('33 coins')).toBeInTheDocument();
    expect(within(cart).getByRole('heading', { name: 'Checkout earns 1 stamp' })).toBeInTheDocument();
  });

  it('drops item prices when a coupon is bought, and only a bigger coupon replaces it', async () => {
    startWith({ coins: 5000 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await screen.findByRole('button', { name: 'Buy Watch for 50 coins' });
    await userEvent.click(screen.getByRole('button', { name: /^Perks/ }));
    const perks = screen.getByRole('dialog', { name: 'Perks' });
    await userEvent.click(within(perks).getByRole('button', { name: 'Buy a 10% off coupon' }));
    expect(within(perks).getByRole('button', { name: 'Buy a 5% off coupon' })).toBeDisabled();
    await userEvent.click(within(perks).getByRole('button', { name: 'Upgrade to a 20% off coupon' }));
    await userEvent.click(within(perks).getByRole('button', { name: 'Close perks' }));

    expect(screen.getByRole('button', { name: 'Buy Watch for 40 coins' })).toBeInTheDocument();
    expect(screen.getAllByText('was', { exact: false })).toHaveLength(products.length);
    expect(screen.getByText(/everything until checkout/)).toHaveTextContent('20% off everything until checkout');
  });

  it('will not sell an item the player cannot afford', async () => {
    startWith({ coins: 20 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    const watch = await screen.findByRole('button', { name: /^Watch: need \d+ more coins$/ });
    expect(watch).toBeDisabled();
    expect(watch).toHaveTextContent(/^Need \d+$/);
  });

  it('refunds what was paid when an item is sold back from the cart', async () => {
    startWith({ coins: 10 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Buy Backpack for 10 coins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cart, 1 items' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sell one Backpack back for 10 coins' }));
    expect(screen.getByRole('button', { name: 'Cart, 0 items' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Buy Backpack for 10 coins' })).toBeEnabled();
  });

  it('checks out into a printed receipt and empties the cart', async () => {
    startWith({ coins: 50 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Buy Shirt for 11 coins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cart, 1 items' }));
    await userEvent.click(screen.getByRole('button', { name: /Check out/ }));

    const receipt = screen.getByRole('dialog', { name: 'Order printed' });
    expect(within(receipt).getByText('1 × Shirt')).toBeInTheDocument();
    expect(within(receipt).getByText('11 coins')).toBeInTheDocument();
    await userEvent.click(within(receipt).getByRole('button', { name: 'Back to shopping' }));
    expect(screen.getByRole('button', { name: 'Cart, 0 items' })).toBeInTheDocument();
  });

  it('vends a product typed on the machine keypad into the cart, for its coin price', async () => {
    startWith({ coins: 50 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore('/store?mode=machine');

    await userEvent.click(await screen.findByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: '2' }));
    expect(screen.getByRole('status')).toHaveTextContent('A2 · 11 COINS · PRESS VEND');
    await userEvent.click(screen.getByRole('button', { name: 'VEND' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Cart, 1 items' })).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('status')).toHaveTextContent('NEW FIND! ENJOY');
  });

  it('refuses to vend when the player is short on coins', async () => {
    startWith({ coins: 20 });
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore('/store?mode=machine');

    await userEvent.click(await screen.findByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: 'VEND' }));
    expect(screen.getByRole('status')).toHaveTextContent(/NEED \d+ MORE COINS/);
    expect(screen.getByRole('button', { name: 'Cart, 0 items' })).toBeInTheDocument();
  });

  it('switches between the room and the machine without losing the cart', async () => {
    startWith({});
    respondWith({ ok: true, status: 200, json: async () => products });
    renderStore();

    await userEvent.click(await screen.findByRole('button', { name: 'Buy Backpack for 10 coins' }));
    await userEvent.click(screen.getByRole('button', { name: 'Fake-o-Mat' }));
    expect(await screen.findByRole('group', { name: 'Keypad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cart, 1 items' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fake-o-Mat' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an error message when the API refuses the request', async () => {
    startWith({});
    respondWith({ ok: false, status: 403, json: async () => { throw new SyntaxError('Unexpected token <'); } });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderStore();

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong loading the products');
    expect(console.error).toHaveBeenCalledWith(expect.objectContaining({ message: 'Product request failed with HTTP 403' }));
  });
});
