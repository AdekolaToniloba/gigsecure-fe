import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  AssessedHero,
  AssessedOverview,
} from '@/components/dashboard/overview/assessed-hero';
import {
  RiskLevelCard,
  RiskLevelCardError,
  RiskLevelCardSkeleton,
} from '@/components/dashboard/overview/risk-level-card';

describe('AssessedHero', () => {
  it('matches the assessed snapshot action contract', () => {
    render(<AssessedHero />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Here’s your financial snapshot.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Explore Marketplace/i })).toHaveAttribute(
      'href',
      '/marketplace'
    );

    const demo = screen.getByRole('button', { name: 'View Product Demo' });
    expect(demo).toBeDisabled();
    expect(demo).toHaveAccessibleDescription('The product demo is coming soon.');
  });

  it('wraps long explicit copy and its CTA row on narrow cards', () => {
    const description = `A ${'financial '.repeat(40)}snapshot explanation`;
    render(<AssessedHero description={description} />);

    expect(screen.getByText(description)).toHaveClass(
      'min-w-0',
      'break-words',
      '[overflow-wrap:anywhere]'
    );
    expect(
      screen.getByRole('link', { name: /Explore Marketplace/i }).parentElement
    ).toHaveClass('min-w-0', 'flex-wrap');
  });
});

describe('RiskLevelCard', () => {
  it.each([
    ['Low Risk', 0],
    ['Moderate Risk', 68.5],
    ['Elevated specialist-contractor concentration risk', 100],
  ])('renders the authoritative profile %s and score %s without enum assumptions', (profile, score) => {
    render(<RiskLevelCard risk_profile={profile} overall_score={score} />);

    const card = screen.getByRole('article', { name: 'Financial Risk Level' });
    const visual = within(card).getByRole('img', {
      name: `${profile}, score ${score} out of 100`,
    });

    expect(visual).toHaveAttribute('data-visual-score', String(score));
    expect(visual).toHaveStyle({
      background: `conic-gradient(var(--color-accent) 0 ${score}%, var(--color-app-sidebar) ${score}% 100%)`,
    });
    expect(within(card).getByText(profile)).toBeVisible();
    expect(within(visual).getByText(String(score))).toBeVisible();
    expect(within(visual).getByText('out of 100')).toBeVisible();
  });

  it('clamps only defensive ring geometry, not displayed assessment text', () => {
    const { rerender } = render(
      <RiskLevelCard risk_profile="Below contract" overall_score={-5} />
    );

    expect(screen.getByRole('img')).toHaveAttribute('data-visual-score', '0');
    expect(screen.getByText('-5')).toBeVisible();

    rerender(<RiskLevelCard risk_profile="Above contract" overall_score={120} />);

    expect(screen.getByRole('img')).toHaveAttribute('data-visual-score', '100');
    expect(screen.getByText('120')).toBeVisible();
  });

  it('keeps long backend-authored profile text inside the card', () => {
    const profile = `Risk profile ${'with extended context '.repeat(20)}`.trim();
    render(<RiskLevelCard risk_profile={profile} overall_score={54} />);

    expect(screen.getByRole('article', { name: 'Financial Risk Level' })).toHaveClass(
      'min-w-0',
      'overflow-hidden'
    );
    expect(screen.getByText(profile)).toHaveClass(
      'break-words',
      '[overflow-wrap:anywhere]'
    );
  });
});

describe('assessed risk states', () => {
  it('isolates assessment loading while preserving the snapshot hero', () => {
    render(<AssessedOverview riskLevel={<RiskLevelCardSkeleton />} />);

    expect(
      screen.getByRole('heading', { name: 'Here’s your financial snapshot.' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: 'Loading financial risk level' })
    ).toHaveTextContent('Loading financial risk level…');
    expect(
      screen
        .getByRole('status', { name: 'Loading financial risk level' })
        .querySelector('[aria-hidden="true"]')
    ).toHaveClass('motion-reduce:[&_*]:animate-none');
  });

  it('isolates an accessible assessment error and retries by keyboard', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <AssessedOverview riskLevel={<RiskLevelCardError onRetry={onRetry} />} />
    );

    expect(
      screen.getByRole('heading', { name: 'Here’s your financial snapshot.' })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'We could not load your latest risk assessment right now.'
    );

    await user.tab();
    expect(screen.getByRole('link', { name: /Explore Marketplace/i })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('stacks through tablet widths and uses bounded desktop columns', () => {
    render(
      <AssessedOverview
        riskLevel={<RiskLevelCard risk_profile="Moderate Risk" overall_score={68.5} />}
      />
    );

    expect(screen.getByRole('region', { name: 'Financial snapshot' })).toHaveClass(
      'min-w-0',
      'grid-cols-1',
      'lg:grid-cols-[minmax(0,3fr)_minmax(16rem,1fr)]'
    );
  });
});
