import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CTA from '@/components/home/CTA';

// Mock framer-motion to return standard tags
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    path: ({ children, ...props }: any) => <path {...props}>{children}</path>,
  },
}));

describe('CTA Component', () => {
  it('renders the central card heading', () => {
    render(<CTA />);
    expect(screen.getByRole('heading', { level: 2, name: /Measure your gig stability/i })).toBeInTheDocument();
  });

  it('renders the Waitlist button', () => {
    render(<CTA />);
    // Testing the button presence
    const button = screen.getByRole('button', { name: /join for early access/i });
    expect(button).toBeInTheDocument();
  });

  it('renders the target image securely', () => {
    render(<CTA />);
    const image = screen.getByAltText(/Delivery rider active in the CTA layout/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('413aa6d39706739b55c3d3547197c15e8942316d.webp'));
  });

  it('renders the mini avatars group', () => {
    render(<CTA />);
    expect(screen.getByAltText(/User avatar 1/i)).toBeInTheDocument();
    expect(screen.getByAltText(/User avatar 2/i)).toBeInTheDocument();
    expect(screen.getByAltText(/User avatar 3/i)).toBeInTheDocument();
  });
});
