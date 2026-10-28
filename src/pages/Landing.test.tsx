import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import Landing from './Landing';

describe('Landing', () => {
  it('offers a single link into the store', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Click here to start shopping' })).toHaveAttribute('href', '/store');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
