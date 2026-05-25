import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FAQPage from '@/app/(public)/faq/page';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  const { MockAnimatePresence, motionTag } = await import('@/__tests__/mock-components');
  return {
    ...actual,
    motion: {
      div: motionTag('div'),
      h2: motionTag('h2'),
      button: motionTag('button'),
      path: motionTag('path'),
    },
    AnimatePresence: MockAnimatePresence,
  };
});

// Mock next/image to avoid issues during tests
vi.mock('next/image', async () => ({
  default: (await import('@/__tests__/mock-components')).MockImage,
}));

// Mock next/link to avoid router context issues
vi.mock('next/link', async () => ({
  default: (await import('@/__tests__/mock-components')).MockLink,
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
