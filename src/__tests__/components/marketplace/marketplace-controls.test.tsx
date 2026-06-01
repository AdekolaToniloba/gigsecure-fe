import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterSidebarShell } from '@/components/marketplace/filter-sidebar/filter-sidebar-shell';
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar';
import { RiskLevelFilter } from '@/components/marketplace/risk-level-filter';
import { marketplaceProducts } from '@/mocks/handlers/marketplace';
import { useAuthStore } from '@/store/auth-store';
import { mockPathname, mockRouter, mockSearchParams } from '@/__tests__/test-utils';

const additionalProduct = {
  ...marketplaceProducts[0],
  id: 'prod-extra',
  provider: {
    id: 'provider-heirs',
    slug: 'heirs',
    name: 'Heirs Insurance',
    logo_url: null,
  },
};

beforeEach(() => {
  mockPathname.value = '/marketplace';
  mockRouter.replace.mockReset();
  [...mockSearchParams.keys()].forEach((key) => mockSearchParams.delete(key));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('MarketplaceNavbar', () => {
  it('hydrates search from the URL and debounces q updates into search params', () => {
    vi.useFakeTimers();
    mockSearchParams.set('q', 'income');
    render(<MarketplaceNavbar />);

    const search = screen.getByRole('searchbox', { name: 'Search marketplace plans' });
    expect(search).toHaveValue('income');

    fireEvent.change(search, { target: { value: 'equipment' } });
    act(() => {
      vi.advanceTimersByTime(349);
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(mockRouter.replace).toHaveBeenCalledWith('/marketplace?q=equipment', { scroll: false });
  });

  it('exposes navbar placeholders as named non-functional controls', () => {
    render(<MarketplaceNavbar />);

    expect(screen.getByRole('button', { name: 'Notifications coming soon' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Premiums coming soon' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Take A Tour' })).toBeDisabled();
  });
});

describe('FilterSidebarShell', () => {
  it('hydrates sidebar filters and applies pending changes only after Apply Filters', async () => {
    const user = userEvent.setup();
    mockSearchParams.append('category', 'Income Protection');
    mockSearchParams.append('provider_slug', 'axa-mansard');
    mockSearchParams.set('max_premium', '10000');
    render(<FilterSidebarShell products={marketplaceProducts} />);

    expect(screen.getByRole('checkbox', { name: 'Income Protection' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'AXA Mansard' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Monthly premium' })).toHaveValue('10000');

    await user.click(screen.getByRole('checkbox', { name: 'Equipment Protection' }));
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Apply Filters' }));
    expect(mockRouter.replace).toHaveBeenCalledWith(
      '/marketplace?category=Income+Protection&category=Equipment+Protection&provider_slug=axa-mansard&max_premium=10000',
      { scroll: false }
    );
  });

  it('clears pending and applied filters', async () => {
    const user = userEvent.setup();
    mockSearchParams.append('category', 'Income Protection');
    mockSearchParams.set('q', 'income');
    mockSearchParams.set('risk_level', 'low');
    mockSearchParams.set('offset', '20');
    render(<FilterSidebarShell products={marketplaceProducts} />);

    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(screen.getByRole('checkbox', { name: 'Income Protection' })).not.toBeChecked();
    expect(mockRouter.replace).toHaveBeenCalledWith('/marketplace', { scroll: false });
  });

  it('searches providers and expands the collapsed provider list', async () => {
    const user = userEvent.setup();
    render(<FilterSidebarShell products={[...marketplaceProducts, additionalProduct]} />);

    expect(screen.queryByRole('checkbox', { name: 'Heirs Insurance' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View more' }));
    expect(screen.getByRole('checkbox', { name: 'Heirs Insurance' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'View less' }));
    expect(screen.queryByRole('checkbox', { name: 'Heirs Insurance' })).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: 'Search providers' }), 'Heirs');
    expect(screen.getByRole('checkbox', { name: 'Heirs Insurance' })).toBeInTheDocument();
  });

  it('shows the assessment prompt only when riskAssessed is false', () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: false,
      });
    });
    const { rerender } = render(<FilterSidebarShell products={marketplaceProducts} />);

    expect(screen.getByRole('heading', { name: 'Need Help Choosing' })).toBeInTheDocument();

    act(() => {
      useAuthStore.getState().setFlags({ riskAssessed: true });
    });
    rerender(<FilterSidebarShell products={marketplaceProducts} />);

    expect(screen.queryByRole('heading', { name: 'Need Help Choosing' })).not.toBeInTheDocument();
  });
});

describe('RiskLevelFilter', () => {
  it('hydrates the active risk level and updates URL state immediately', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('risk_level', 'moderate');
    mockSearchParams.set('offset', '20');
    render(<RiskLevelFilter />);

    expect(screen.getByRole('button', { name: 'Moderate Risk' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'High Risk' }));
    expect(mockRouter.replace).toHaveBeenCalledWith('/marketplace?risk_level=high', {
      scroll: false,
    });

    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(mockRouter.replace).toHaveBeenLastCalledWith('/marketplace', { scroll: false });
  });
});
