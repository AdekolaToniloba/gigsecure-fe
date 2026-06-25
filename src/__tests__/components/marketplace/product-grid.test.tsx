import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from '@/components/marketplace/product-card';
import { ProductGrid } from '@/components/marketplace/product-grid';
import { marketplaceProducts } from '@/mocks/handlers/marketplace';

describe('ProductCard', () => {
  it('renders product content and falls back to provider initials when no logo exists', () => {
    const onOpen = vi.fn();
    render(<ProductCard product={marketplaceProducts[0]} onOpen={onOpen} />);

    expect(screen.getByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeInTheDocument();
    expect(screen.getByText('AXA Mansard')).toBeInTheDocument();
    expect(screen.getByText('130,000')).toBeInTheDocument();
    expect(screen.getByText('9,500')).toBeInTheDocument();
    expect(screen.getByText('AM')).toBeInTheDocument();
  });

  it('opens product details on click, Enter, and Space', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ProductCard product={marketplaceProducts[0]} onOpen={onOpen} />);

    const trigger = screen.getByRole('button', {
      name: 'Open details for Income Shield for Gig Workers',
    });
    await user.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Enter' });
    fireEvent.keyDown(trigger, { key: ' ' });

    expect(onOpen).toHaveBeenCalledTimes(3);
  });

  it('opens through the Explore Plan CTA without double-triggering the card click handler', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<ProductCard product={marketplaceProducts[0]} onOpen={onOpen} />);

    await user.click(screen.getByRole('button', { name: /Explore Plan/i }));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});

describe('ProductGrid', () => {
  it('shows skeleton cards while loading', () => {
    render(<ProductGrid products={[]} isLoading onOpenProduct={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading marketplace plans...');
    expect(screen.getAllByText((_, node) => node?.getAttribute('aria-hidden') === 'true')).not.toHaveLength(0);
  });

  it('shows an empty state when no products match filters', () => {
    render(<ProductGrid products={[]} onOpenProduct={vi.fn()} />);

    expect(screen.getByRole('status')).toHaveTextContent('No products match your current filters.');
  });

  it('shows a parsed error state with retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ProductGrid
        products={[]}
        error={{ response: { data: { detail: 'Unable to load products.' }, status: 400 } }}
        onRetry={onRetry}
        onOpenProduct={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load products.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders responsive cards and exposes load more state', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <ProductGrid
        products={marketplaceProducts.slice(0, 4)}
        total={8}
        limit={4}
        offset={0}
        onLoadMore={onLoadMore}
        onOpenProduct={vi.fn()}
      />
    );

    expect(screen.getAllByRole('button', { name: /Open details for/i })).toHaveLength(4);
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows a loading-more status region while fetching the next page', () => {
    render(
      <ProductGrid
        products={marketplaceProducts.slice(0, 4)}
        total={8}
        limit={4}
        offset={0}
        isLoadingMore
        onLoadMore={vi.fn()}
        onOpenProduct={vi.fn()}
      />
    );

    expect(screen.getByText('Loading more plans...')).toHaveAttribute('role', 'status');
    expect(screen.getByRole('button', { name: /Loading more/i })).toHaveAttribute('aria-busy', 'true');
  });
});
