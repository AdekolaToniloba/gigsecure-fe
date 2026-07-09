import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RiskAssessmentPage from '@/app/(public)/risk-assessment/page';
import { mockRouter } from '../test-utils';

// Mock framer-motion to bypass IntersectionObserver and render synchronously for tests
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  const { MockAnimatePresence, motionTag } = await import('@/__tests__/mock-components');
  return {
    ...actual,
    motion: {
      div: motionTag('div'),
      h1: motionTag('h1'),
      h2: motionTag('h2'),
      h3: motionTag('h3'),
      p: motionTag('p'),
      button: motionTag('button'),
    },
    AnimatePresence: MockAnimatePresence,
  };
});

// Mock next/image to avoid issues during tests
vi.mock('next/image', async () => ({
  default: (await import('@/__tests__/mock-components')).MockImage,
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

  it('keeps hero and floating acquisition CTAs pointed at the waitlist', async () => {
    const user = userEvent.setup();
    render(<RiskAssessmentPage />);
    await user.click(screen.getByRole('button', { name: /take the assessment/i }));
    expect(mockRouter.push).toHaveBeenLastCalledWith('/waitlist');

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    fireEvent.scroll(window);
    const buttons = await screen.findAllByRole('button', { name: /take the assessment/i });
    await user.click(buttons.at(-1)!);
    expect(mockRouter.push).toHaveBeenLastCalledWith('/waitlist');
  });
});
