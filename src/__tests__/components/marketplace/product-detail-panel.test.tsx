import React, { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { ProductDetailPanel } from '@/components/marketplace/product-detail-panel';
import { marketplaceProducts } from '@/mocks/handlers/marketplace';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/__tests__/test-utils';

vi.mock('framer-motion', async () => {
  const { MockAnimatePresence, motionTag } = await import('@/__tests__/mock-components');

  return {
    AnimatePresence: MockAnimatePresence,
    motion: {
      aside: motionTag('aside'),
      div: motionTag('div'),
    },
  };
});

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

describe('ProductDetailPanel', () => {
  it('does not render when closed', () => {
    renderWithProviders(
      <ProductDetailPanel isOpen={false} productId={null} onClose={vi.fn()} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders accessible dialog semantics, public product details, and omits policy-only sections', async () => {
    renderWithProviders(
      <ProductDetailPanel
        isOpen
        productId={marketplaceProducts[0].id}
        fallbackProduct={marketplaceProducts[0]}
        onClose={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog', { name: 'Income Shield for Gig Workers' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleDescription(
      /Income Protection that provides financial support when unexpected events interrupt your work./i
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Close product details panel/i })).toHaveFocus();
    });

    expect(screen.getByText(/Company:\s*AXA Mansard/i)).toBeInTheDocument();
    expect(screen.getByText('What this plan covers')).toBeInTheDocument();
    expect(screen.getByText(/Marketplace purchase flow is coming soon/i)).toBeInTheDocument();
    expect(screen.queryByText('Plan Timeline')).not.toBeInTheDocument();

    expect(dialog.className).toContain('rounded-t-3xl');
    expect(dialog.className).toContain('sm:rounded-none');
  });

  it('closes by close button, Escape, and backdrop click while restoring focus to the opener', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PanelHarness />);

    const opener = screen.getByRole('button', { name: 'Open product panel' });

    await user.click(opener);
    await user.click(screen.getByRole('button', { name: /Close product details panel/i }));
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });

    await user.click(opener);
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });

    await user.click(opener);
    await user.click(screen.getByTestId('marketplace-product-panel-backdrop'));
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });

  it('traps keyboard focus inside the panel', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProductDetailPanel
        isOpen
        productId={marketplaceProducts[0].id}
        fallbackProduct={marketplaceProducts[0]}
        onClose={vi.fn()}
      />
    );

    const closeButton = screen.getByRole('button', { name: /Close product details panel/i });

    await waitFor(() => {
      expect(closeButton).toHaveFocus();
    });

    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(closeButton).toHaveFocus();
  });

  it('shows a loading state while fetching public product details', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/marketplace/products/:id`, async ({ params }) => {
        await delay(100);
        const product = marketplaceProducts.find((item) => item.id === params.id);
        return HttpResponse.json(product);
      })
    );

    renderWithProviders(
      <ProductDetailPanel
        isOpen
        productId={marketplaceProducts[1].id}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading plan details...');
    expect(await screen.findByRole('dialog', { name: 'Equipment Protection Plus' })).toBeInTheDocument();
  });

  it('shows a parsed error and retry action when public detail loading fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <ProductDetailPanel isOpen productId="missing-product" onClose={vi.fn()} />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Product not found');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

function PanelHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open product panel
      </button>
      <ProductDetailPanel
        isOpen={isOpen}
        productId={marketplaceProducts[0].id}
        fallbackProduct={marketplaceProducts[0]}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}
