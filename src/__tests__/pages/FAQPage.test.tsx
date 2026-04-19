import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FAQPage from '@/app/(public)/faq/page';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <div {...props}>{children}</div>,
      h2: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <h2 {...props}>{children}</h2>,
      button: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <button {...props}>{children}</button>,
      path: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <path {...props} />,
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

// Mock next/image to avoid issues during tests
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || 'Mocked image'} />;
  },
}));

// Mock next/link to avoid router context issues
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

describe('FAQPage', () => {
  it('renders the header and FAQ list', () => {
    render(<FAQPage />);
    
    // Check Header Text
    expect(screen.getByText(/Everything You need To Know/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /FAQ'S/i })).toBeInTheDocument();
    
    // Check if some specific questions are loaded
    expect(screen.getByRole('button', { name: /1. Is GigSecure a real insurance company/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /12. Why are you even providing this service for us/i })).toBeInTheDocument();
  });

  it('toggles FAQ answers when clicked', async () => {
    render(<FAQPage />);
    
    const firstButton = screen.getByRole('button', { name: /1. Is GigSecure a real insurance company/i });
    expect(firstButton).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(firstButton);
    
    await waitFor(() => {
      expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    });

    const answers = screen.getAllByText(/GigSecure is a registered intermediary platform in Nigeria/i);
    expect(answers.length).toBeGreaterThan(0);
  });
});
