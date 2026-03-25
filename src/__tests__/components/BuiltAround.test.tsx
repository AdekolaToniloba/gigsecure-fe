import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import BuiltAround from '@/components/home/BuiltAround';

// Mock framer-motion to return standard tags, ignoring animation wrappers so elements are immediately visible to testing-library
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

describe('BuiltAround Component', () => {
  it('renders the main heading text correctly', () => {
    render(<BuiltAround />);
    
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent(/Insurance Built Around/i);
    expect(heading).toHaveTextContent(/How Gig Workers Actually/i);
    expect(heading).toHaveTextContent(/Earn/i);
  });

  it('renders the descriptive paragraph properly', () => {
    render(<BuiltAround />);
    expect(screen.getByText(/GigSecure evaluates income patterns, client concentration/i)).toBeInTheDocument();
  });

  it('renders the CTA and Play buttons exactly', () => {
    render(<BuiltAround />);
    
    // View Plans CTA Button
    const viewBtn = screen.getByRole('button', { name: /View Insurance Plans/i });
    expect(viewBtn).toBeInTheDocument();
    
    // Play Video Button
    const playBtn = screen.getByRole('button', { name: /Play video/i });
    expect(playBtn).toBeInTheDocument();
  });

  it('renders the target image with appropriate alt text', () => {
    render(<BuiltAround />);
    
    const bannerImage = screen.getByAltText(/Freelancer with earmuffs working on a laptop/i);
    expect(bannerImage).toBeInTheDocument();
    expect(bannerImage).toHaveAttribute('src', expect.stringContaining('a6240d543a2fedd60dfd5beb2da99377a37a0c93.webp'));
  });
});
