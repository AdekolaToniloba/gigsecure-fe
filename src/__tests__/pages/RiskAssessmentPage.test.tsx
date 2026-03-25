import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import RiskAssessmentPage from '@/app/(public)/risk-assessment/page';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
      h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
      p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
      button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
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

describe('RiskAssessmentPage Component Integrations', () => {
  it('renders all structural components of the risk assessment page cleanly', () => {
    render(<RiskAssessmentPage />);
    
    // RiskHero
    expect(screen.getByText(/67% of Nigerian gig workers have less than/i)).toBeInTheDocument();
    
    // Fragile
    expect(screen.getByRole('heading', { name: /Gig Work looks flexible, But it's fragile./i })).toBeInTheDocument();
    
    // DashboardPreview
    expect(screen.getByRole('heading', { name: /Your Personalized Risk Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Equipment Dependency/i)).toBeInTheDocument();
    
    // NotGeneric
    expect(screen.getByRole('heading', { name: /This isn't generic financial advice./i })).toBeInTheDocument();
    expect(screen.getByText(/Juggle multiple clients and unpredictable income/i)).toBeInTheDocument();
    
    // WhatHappensAfter
    expect(screen.getByRole('heading', { name: /What Happens After/i })).toBeInTheDocument();
    expect(screen.getByText(/Emergency Cash Backup/i)).toBeInTheDocument();
    
    // QuickQuestions
    expect(screen.getByRole('heading', { name: /Answer a few simple questions about your work/i })).toBeInTheDocument();
    
    // BuiltForPeople
    expect(screen.getByRole('heading', { name: /GigSecure is built for people/i })).toBeInTheDocument();
  });
});
