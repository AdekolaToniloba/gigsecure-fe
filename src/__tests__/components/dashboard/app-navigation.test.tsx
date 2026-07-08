import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppNavigation } from '@/components/dashboard/shell/app-navigation';
import { AppSidebar } from '@/components/dashboard/shell/app-sidebar';
import { MarketplacePromoCard } from '@/components/dashboard/shell/marketplace-promo-card';
import { MobileNavigationDrawer } from '@/components/dashboard/shell/mobile-navigation-drawer';

const navigation = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
}));

beforeEach(() => {
  navigation.pathname = '/dashboard';
  document.body.style.overflow = '';
});

describe('AppNavigation', () => {
  it('uses real routes for available destinations and marks Overview active', () => {
    render(<AppNavigation />);

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Risk Assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment'
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/dashboard/settings'
    );
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Overview',
      'Risk Assessment',
      'Premiums BoughtSoon',
      'ProfileSoon',
      'Settings',
    ]);
  });

  it('marks Risk Assessment active on its route', () => {
    navigation.pathname = '/dashboard/risk-assessment';
    render(<AppNavigation />);

    expect(screen.getByRole('link', { name: 'Risk Assessment' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it('marks Settings active on its route', () => {
    navigation.pathname = '/dashboard/settings';
    render(<AppNavigation />);

    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Overview' })).not.toHaveAttribute('aria-current');
  });

  it.each(['Premiums Bought', 'Profile'])(
    'renders %s as visibly unavailable without a broken link',
    (label) => {
      render(<AppNavigation />);

      expect(screen.queryByRole('link', { name: label })).not.toBeInTheDocument();
      expect(screen.getByText(label).closest('[aria-disabled="true"]')).toBeInTheDocument();
      expect(screen.getByText(label).closest('li')).toHaveTextContent('Soon');
    }
  );

  it('keeps unavailable rows out of the keyboard order', async () => {
    const user = userEvent.setup();
    render(<AppNavigation />);

    await user.tab();
    expect(screen.getByRole('link', { name: 'Overview' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Risk Assessment' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveFocus();
  });
});

describe('AppSidebar', () => {
  it('renders the owned GigSecure mark and the shared navigation model', () => {
    render(<AppSidebar />);

    expect(screen.getByRole('link', { name: 'GigSecure dashboard' })).toHaveAttribute(
      'href',
      '/dashboard'
    );
    expect(screen.getByAltText('GigSecure')).toHaveAttribute('width', '194');
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
  });
});

describe('MarketplacePromoCard', () => {
  it('uses the supplied explicit-dimension artwork and routes to the public marketplace', () => {
    render(<MarketplacePromoCard />);

    expect(screen.getByRole('link', { name: 'Explore marketplace' })).toHaveAttribute(
      'href',
      '/marketplace'
    );
    const artwork = screen.getByRole('img', {
      name: 'Umbrella and shield representing insurance protection',
    });
    expect(artwork).toHaveAttribute('width', '480');
    expect(artwork).toHaveAttribute('height', '320');
  });
});

describe('MobileNavigationDrawer', () => {
  it('opens accessibly, announces itself, traps focus, and locks body scroll', async () => {
    const user = userEvent.setup();
    render(<MobileNavigationDrawer />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Application navigation' });
    const closeButton = within(dialog).getByRole('button', { name: 'Close navigation menu' });
    const marketplaceLink = within(dialog).getByRole('link', { name: 'Explore marketplace' });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(dialog).toHaveClass(
      'w-[min(18.625rem,calc(100vw-2rem))]',
      'max-w-full',
      'overscroll-contain',
    );
    expect(screen.getByRole('status')).toHaveTextContent('Navigation menu opened');
    expect(document.body.style.overflow).toBe('hidden');
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(marketplaceLink).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('closes by Escape and restores focus and body scrolling', async () => {
    const user = userEvent.setup();
    render(<MobileNavigationDrawer />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: 'Application navigation' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });

  it('closes from the backdrop and explicit close control', async () => {
    const user = userEvent.setup();
    render(<MobileNavigationDrawer />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    await user.click(screen.getByTestId('mobile-navigation-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Close navigation menu' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes after following a real navigation destination', async () => {
    const user = userEvent.setup();
    render(<MobileNavigationDrawer />);

    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Application navigation' });
    const assessmentLink = within(dialog).getByRole('link', { name: 'Risk Assessment' });
    assessmentLink.addEventListener('click', (event) => event.preventDefault(), { once: true });
    await user.click(assessmentLink);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(trigger).toHaveFocus();
  });

  it('keeps its trigger mobile-only and at least 44px square', () => {
    const { container } = render(<MobileNavigationDrawer />);

    expect(container.firstElementChild).toHaveClass('lg:hidden');
    expect(screen.getByRole('button', { name: 'Open navigation menu' })).toHaveClass(
      'h-11',
      'w-11'
    );
  });
});
