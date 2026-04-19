import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FAQ from '@/components/home/FAQ';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <div {...props}>{children}</div>,
      h2: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <h2 {...props}>{children}</h2>,
      button: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <button {...props}>{children}</button>,
    },
    // For AnimatePresence, we just render children directly in the mock
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('FAQ Component', () => {
  it('renders the section heading correctly', () => {
    render(<FAQ />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/Everything You Need to Know Before/i);
    expect(heading).toHaveTextContent(/You Get Covered/i);
  });

  it('renders three accordion items and a view all link', () => {
    render(<FAQ />);
    
    expect(screen.getByRole('button', { name: /Is GigSecure a real/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Does GigSecure sell/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Why should I trust/i })).toBeInTheDocument();

    const viewAllLink = screen.getByRole('link', { name: /View all/i });
    expect(viewAllLink).toBeInTheDocument();
    expect(viewAllLink).toHaveAttribute('href', '/faq');
  });

  it('toggles accordion answers when clicked', async () => {
    render(<FAQ />);
    
    const firstButton = screen.getByRole('button', { name: /Is GigSecure a real/i });
    const secondButton = screen.getByRole('button', { name: /Does GigSecure sell/i });

    // Initially, the third item is open (based on screenshot default state of openIndex=2), meaning the first two are closed
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    
    // Click the first button to open it
    fireEvent.click(firstButton);
    
    await waitFor(() => {
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    // The answer content should now be within the document
    const answers = screen.getAllByText(/GigSecure is a registered intermediary platform in Nigeria/i);
    expect(answers.length).toBeGreaterThan(0);
    
    // Click the second button. The first one should close, the second opens.
    fireEvent.click(secondButton);
    
    await waitFor(() => {
      expect(firstButton).toHaveAttribute('aria-expanded', 'false');
      expect(secondButton).toHaveAttribute('aria-expanded', 'true');
    });
  });

  it('renders the target image with proper alt text', () => {
    render(<FAQ />);
    
    const image = screen.getByAltText(/Delivery rider handing a package to a customer/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('7aaf320626defa49daffc84b4be9093d38323454.webp'));
  });
});
