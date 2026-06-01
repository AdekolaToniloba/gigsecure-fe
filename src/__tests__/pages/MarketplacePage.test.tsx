import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MarketplaceRoute, { metadata } from '@/app/(public)/marketplace/page';
import { useAuthStore } from '@/store/auth-store';
import { mockPathname, mockRouter, mockSearchParams, renderWithProviders } from '@/__tests__/test-utils';

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

vi.mock('next/image', async () => ({
  default: (await import('@/__tests__/mock-components')).MockImage,
}));

describe('MarketplacePage', () => {
  it('defines public marketplace metadata', () => {
    expect(metadata.title).toBe('Marketplace | GigSecure');
    expect(metadata.description).toMatch(/public insurance plans/i);
  });

  it('renders the public marketplace shell for anonymous browsing and opens the detail panel', async () => {
    const user = userEvent.setup();
    mockPathname.value = '/marketplace';
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    [...mockSearchParams.keys()].forEach((key) => mockSearchParams.delete(key));

    renderWithProviders(<MarketplaceRoute />);

    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Search marketplace plans' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Recommended plans' })
    ).toBeInTheDocument();

    const planButton = await screen.findByRole('button', {
      name: 'Open details for Income Shield for Gig Workers',
    });
    expect(planButton).toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: 'Explore Plan' })[0]);
    expect(
      await screen.findByRole('dialog', { name: 'Income Shield for Gig Workers' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Close product details panel/i }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('keeps browsing public while recommendation access routes anonymous users to login', async () => {
    const user = userEvent.setup();
    mockPathname.value = '/marketplace';
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    [...mockSearchParams.keys()].forEach((key) => mockSearchParams.delete(key));
    useAuthStore.getState().clearAuth();

    renderWithProviders(<MarketplaceRoute />);

    expect(
      await screen.findByRole('button', { name: 'Open details for Income Shield for Gig Workers' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View Recommendations' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=%2Fmarketplace');
    expect(screen.getByRole('heading', { name: 'Filters' })).toBeInTheDocument();
  });
});
