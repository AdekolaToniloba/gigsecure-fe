import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage from '@/app/(public)/about/page';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <h1 {...props}>{children}</h1>,
      h2: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <h2 {...props}>{children}</h2>,
      h3: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <h3 {...props}>{children}</h3>,
      p: ({ children, whileHover, whileInView, whileTap, viewport, transition, initial, animate, exit, variants, ...props }: any) => <p {...props}>{children}</p>,
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

describe('AboutPage', () => {
  it('renders all structural components of the about page accurately', () => {
    render(<AboutPage />);
    
    // About Hero
    expect(screen.getByText(/Nigeria's gig workers are building the economy/i)).toBeInTheDocument();
    
    // The Truth
    expect(screen.getByRole('heading', { name: /The Truth Behind GigSecure/i })).toBeInTheDocument();
    expect(screen.getByAltText(/Gig worker smiling/i)).toBeInTheDocument();
    
    // Mission Vision
    expect(screen.getByRole('heading', { name: /Our Mission/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Our Vision/i })).toBeInTheDocument();
    
    // What We Do
    expect(screen.getByRole('heading', { name: /What We Do/i })).toBeInTheDocument();
    
    // Our Story
    expect(screen.getByRole('heading', { name: /Our Story/i })).toBeInTheDocument();
    expect(screen.getByText(/What happens if income slows\?/i)).toBeInTheDocument();
    
    // Bottom Statement
    expect(screen.getByText(/We believe protection should reflect real life/i)).toBeInTheDocument();
  });
});
