import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/layout/Footer';

describe('Footer Component', () => {
  it('renders the brand logo and descriptive text', () => {
    render(<Footer />);
    expect(screen.getByAltText(/GigSecure Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/GigSecure evaluates your income patterns/i)).toBeInTheDocument();
  });

  it('renders accurate navigation links mapping', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /Insurance Policies/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Buy/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Terms and Conditions/i })).toBeInTheDocument();
    const marketplaceLinks = screen.getAllByRole('link', { name: /Marketplace/i });
    expect(marketplaceLinks.length).toBe(1);
  });

  it('renders the copyright bar accurately', () => {
    render(<Footer />);
    expect(screen.getByText(/@2026 All Rights Reserved/i)).toBeInTheDocument();
  });
});
