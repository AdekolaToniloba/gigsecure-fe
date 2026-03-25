import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HowItWorks from '@/components/home/HowItWorks';

describe('HowItWorks Component', () => {
  it('renders the section heading correctly', () => {
    render(<HowItWorks />);
    
    expect(screen.getByRole('heading', { level: 2, name: /How Gig Secure Works/i })).toBeInTheDocument();
  });

  it('renders all three timeline steps correctly', () => {
    render(<HowItWorks />);
    
    // Test titles
    expect(screen.getByRole('heading', { level: 3, name: 'Sign up' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Take the Risk Assessment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Get Your Risk Score' })).toBeInTheDocument();

    // Test descriptions
    expect(screen.getByText(/Create your account in minutes and tell us about your work/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer a short, structured assessment covering income/i)).toBeInTheDocument();
  });

  it('renders the target image with appropriate alt text', () => {
    render(<HowItWorks />);
    
    const image = screen.getByAltText(/Delivery rider looking at package and phone/i);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', expect.stringContaining('e24691b767ceaed733586e12832b4d03537422cc.webp'));
  });
});
