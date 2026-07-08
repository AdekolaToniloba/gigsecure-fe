import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  UnassessedHero,
  UnassessedOverview,
} from '@/components/dashboard/overview/unassessed-hero';
import { RiskAssessmentPrompt } from '@/components/dashboard/overview/risk-assessment-prompt';

describe('UnassessedOverview', () => {
  it('renders the onboarding content and both real assessment routes', () => {
    render(<UnassessedOverview />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Lets get you protected' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Start with your risk assessment' })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /Take Risk Assessment/i })).toHaveAttribute(
      'href',
      '/assessment'
    );
    expect(screen.getByRole('link', { name: 'Generate Risk Score' })).toHaveAttribute(
      'href',
      '/assessment'
    );
  });

  it('keeps undocumented demo and explainer actions visibly unavailable', () => {
    render(<UnassessedOverview />);

    const demo = screen.getByRole('button', { name: 'View Product Demo' });
    const explainer = screen.getByRole('button', { name: 'See what you will get' });

    expect(demo).toBeDisabled();
    expect(demo).toHaveAccessibleDescription('The product demo is coming soon.');
    expect(explainer).toBeDisabled();
    expect(explainer).toHaveAccessibleDescription('This preview is coming soon.');
    expect(screen.queryByRole('link', { name: /Product Demo|what you will get/i })).not.toBeInTheDocument();
  });

  it('places only real actions in the keyboard focus order', async () => {
    const user = userEvent.setup();
    render(<UnassessedOverview />);

    await user.tab();
    expect(screen.getByRole('link', { name: /Take Risk Assessment/i })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('link', { name: 'Generate Risk Score' })).toHaveFocus();

    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('provides a one-column small-screen layout and bounded desktop columns', () => {
    render(<UnassessedOverview />);

    expect(screen.getByRole('region', { name: 'Risk assessment onboarding' })).toHaveClass(
      'min-w-0',
      'grid-cols-1',
      'lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]'
    );
  });

  it('wraps long explicit copy without changing component behavior', () => {
    const heroCopy = `A ${'very '.repeat(35)}long protection explanation`;
    const promptCopy = `A ${'narrow '.repeat(35)}assessment explanation`;

    render(
      <UnassessedOverview
        heroDescription={heroCopy}
        promptDescription={promptCopy}
      />
    );

    expect(screen.getByText(heroCopy)).toHaveClass(
      'min-w-0',
      'break-words',
      '[overflow-wrap:anywhere]'
    );
    expect(screen.getByText(promptCopy)).toHaveClass(
      'min-w-0',
      'break-words',
      '[overflow-wrap:anywhere]'
    );
  });
});

describe('unassessed first-row cards', () => {
  it('keeps the hero CTA row wrapping within its card', () => {
    render(<UnassessedHero />);

    const hero = screen.getByRole('article', { name: 'Lets get you protected' });
    expect(hero).toHaveClass('min-w-0', 'overflow-hidden');
    expect(within(hero).getByRole('link', { name: /Take Risk Assessment/i }).parentElement).toHaveClass(
      'flex-wrap',
      'min-w-0'
    );
  });

  it('keeps the narrow prompt bounded and independently reusable', () => {
    render(<RiskAssessmentPrompt />);

    expect(screen.getByRole('article', { name: 'Start with your risk assessment' })).toHaveClass(
      'min-w-0',
      'overflow-hidden'
    );
  });
});
