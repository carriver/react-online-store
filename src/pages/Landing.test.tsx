import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Landing from './Landing';

describe('Landing', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('offers a door into each mode and a plain way in', () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => [] }) as unknown as Response));
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Fake Store' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Cozy Room/ })).toHaveAttribute('href', '/store?mode=room');
    expect(screen.getByRole('link', { name: /Fake-o-Mat/ })).toHaveAttribute('href', '/store?mode=machine');
    expect(screen.getByRole('link', { name: 'Click here to start shopping' })).toHaveAttribute('href', '/store');
  });
});
