import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import KnowYourRisk from '@/components/home/KnowYourRisk';

// Mock framer-motion to return standard tags
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('KnowYourRisk Component', () => {
  it('renders the heading and paragraph text appropriately', () => {
    render(<KnowYourRisk />);
    
    expect(screen.getByRole('heading', { level: 2, name: /Know Your Risk/i })).toBeInTheDocument();
    expect(screen.getByText(/GigSecure helps you assess your income stability/i)).toBeInTheDocument();
  });

  it('renders the Contact Us CTA button', () => {
    render(<KnowYourRisk />);
    const contactBtn = screen.getByRole('button', { name: /Contact Us/i });
    expect(contactBtn).toBeInTheDocument();
  });

  it('renders the target image securely', () => {
    render(<KnowYourRisk />);
    const image = screen.getByAltText(/Smiling professional in the/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('ff066588c527ccd21434dec0d44a32b6f4062ba6.webp'));
  });
});
