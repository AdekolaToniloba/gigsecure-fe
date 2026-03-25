import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Features from '@/components/home/Features';

describe('Features Component', () => {
  it('renders the section headings correctly', () => {
    render(<Features />);
    
    // Test for main heading
    expect(screen.getByText(/Designed for the Gig Economy/i)).toBeInTheDocument();
    expect(screen.getByText(/Simplified for Independent Work/i)).toBeInTheDocument();

    // Test for paragraph text
    expect(screen.getByText(/GigSecure provides flexible insurance solutions/i)).toBeInTheDocument();
  });

  it('renders all four feature cards correctly', () => {
    render(<Features />);
    
    // Array of feature titles
    const expectedTitles = [
      'Easy Onboarding',
      'Standardized Data',
      'Flexible Products',
      'Simplified Claims',
    ];

    expectedTitles.forEach((title) => {
      expect(screen.getByRole('heading', { level: 3, name: title })).toBeInTheDocument();
    });
  });
});
