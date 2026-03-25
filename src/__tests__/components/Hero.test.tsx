import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Hero from '@/components/home/Hero';

// Mock Next.js next/image since it handles remote/optimized images differently
vi.mock('next/image', () => ({
  default: ({ src, alt, fill, ...props }: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} />;
  },
}));

describe('Hero Component', () => {
  it('renders the main typography and text correctly', () => {
    render(<Hero />);
    
    // Test for main heading parts
    expect(screen.getByText(/Insurance built for/i)).toBeInTheDocument();
    expect(screen.getByText(/Gig Workers/i)).toBeInTheDocument();

    // Test for description text
    const description = screen.getByText(/GigSecure provides flexible, income-based insurance/i);
    expect(description).toBeInTheDocument();
  });

  it('renders the call to action buttons correctly', () => {
    render(<Hero />);
    
    const waitlistBtn = screen.getByRole('link', { name: /Join Our Waitlist/i });
    expect(waitlistBtn).toBeInTheDocument();
    expect(waitlistBtn).toHaveAttribute('href', '/waitlist');

    const coverBtn = screen.getByRole('link', { name: /Get Covered in Minutes/i });
    expect(coverBtn).toBeInTheDocument();
    expect(coverBtn).toHaveAttribute('href', '/get-covered');
  });

  it('renders the overlapping cards with the correct images and alt text', () => {
    render(<Hero />);
    
    // Left card
    expect(screen.getByText(/Coverage for Drivers and Dispatch Riders/i)).toBeInTheDocument();
    const riderImage = screen.getByAltText(/Delivery rider handing a package/i);
    expect(riderImage).toBeInTheDocument();
    expect(riderImage).toHaveAttribute('src', '/assets/images/a409bd93db42a474a79d789c5121daaf7783679d.webp');

    // Right card
    expect(screen.getByText(/Coverage for Freelancers and Independent Professionals/i)).toBeInTheDocument();
    const freelancerImage = screen.getByAltText(/Freelancer working happily/i);
    expect(freelancerImage).toBeInTheDocument();
    expect(freelancerImage).toHaveAttribute('src', '/assets/images/77b7b280d62e8e9a4f26c135f20e276995476f53.webp');
  });
});
