import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Navbar from '@/components/layout/Navbar';

// Mock matchMedia (used indirectly by some framer-motion/React flows in certain JSDOM setups)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock ResizeObserver for framer-motion AnimatePresence
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('Navbar', () => {
  beforeEach(() => {
    // Reset any dom modifications
    document.body.style.overflow = '';
  });

  it('renders the logo correctly', () => {
    render(<Navbar />);
    // Look for the logo image alt text
    const logoImg = screen.getByAltText(/GigSecure/i);
    expect(logoImg).toBeInTheDocument();
    
    // Specifically verify it's looking for logo.png (next/image adds a bunch of internal attributes, but src includes logo)
    expect(logoImg).toHaveAttribute('src');
    expect(logoImg.getAttribute('src')).toContain('logo.png');
  });

  it('renders desktop navigation links', () => {
    render(<Navbar />);
    // "About" should exist in the document
    expect(screen.getAllByText('About')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Blog')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Marketplace')[0]).toBeInTheDocument();
  });


  it('toggles mobile menu when hamburger is clicked', async () => {
    render(<Navbar />);
    const user = userEvent.setup();
    
    // Check that the mobile menu wrapper does not exist initially
    // We can query by the id "mobile-menu"
    expect(document.getElementById('mobile-menu')).toBeNull();

    const menuButton = screen.getByRole('button', { name: /Open main menu/i });
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    // Click to open
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
    expect(menuButton).toHaveAttribute('aria-label', 'Close main menu');

    // Body should be locked
    expect(document.body.style.overflow).toBe('hidden');

    // Click to close
    await user.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    
    // Body should be unlocked
    expect(document.body.style.overflow).toBe('unset');
  });
});
