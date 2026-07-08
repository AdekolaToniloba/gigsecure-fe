import React from 'react';
import Link from 'next/link';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CircleDollarSign } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardDate } from '@/components/dashboard/overview/dashboard-date';
import { DashboardEmptyState } from '@/components/dashboard/overview/dashboard-empty-state';
import { DashboardErrorState } from '@/components/dashboard/overview/dashboard-error-state';
import {
  MetricCard,
  MetricCardGrid,
} from '@/components/dashboard/overview/metric-card';
import { DashboardSection } from '@/components/dashboard/overview/dashboard-section';
import { DashboardSkeleton } from '@/components/dashboard/overview/dashboard-skeleton';
import { UNAVAILABLE_VALUE } from '@/lib/dashboard/formatters';

describe('MetricCard', () => {
  it('keeps zero distinct from null and undefined values', () => {
    render(
      <MetricCardGrid>
        <MetricCard label="Premiums Bought" value={0} />
        <MetricCard label="Monthly Income" value={null} />
        <MetricCard label="Safety Buffer" value={undefined} />
      </MetricCardGrid>
    );

    expect(screen.getByRole('article', { name: 'Premiums Bought' })).toHaveTextContent('0');
    expect(screen.getByRole('article', { name: 'Monthly Income' })).toHaveTextContent(
      UNAVAILABLE_VALUE
    );
    expect(screen.getByRole('article', { name: 'Safety Buffer' })).toHaveTextContent(
      UNAVAILABLE_VALUE
    );
  });

  it('renders icon, support, action, and long values without fixed-width constraints', () => {
    const longValue = 'A very long validated dashboard value that must wrap safely on narrow screens';
    render(
      <MetricCard
        label="Recommended Plans"
        value={longValue}
        icon={<CircleDollarSign data-testid="metric-icon" />}
        supportingText="Based on your completed financial risk profile."
        action={<Link href="/marketplace">Explore plans</Link>}
      />
    );

    const card = screen.getByRole('article', { name: 'Recommended Plans' });
    expect(card).toHaveClass('min-w-0', 'overflow-hidden');
    expect(screen.getByText(longValue)).toHaveClass('[overflow-wrap:anywhere]');
    expect(screen.getByTestId('metric-icon').parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('link', { name: 'Explore plans' })).toHaveAttribute(
      'href',
      '/marketplace'
    );
  });

  it('provides the required one, two, and four-column grid contract', () => {
    const { container } = render(
      <MetricCardGrid>
        <MetricCard label="Metric" value="Value" />
      </MetricCardGrid>
    );

    expect(container.firstElementChild).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'xl:grid-cols-4',
      'min-w-0'
    );
  });
});

describe('DashboardSection', () => {
  it('creates a labelled h2 section with optional description and action', () => {
    render(
      <DashboardSection
        title="Income Stability Pattern"
        description="Your income trend over the assessment period."
        action={<Link href="/assessment">Update assessment</Link>}
      >
        <p>Section content</p>
      </DashboardSection>
    );

    const section = screen.getByRole('region', { name: 'Income Stability Pattern' });
    expect(
      screen.getByRole('heading', { level: 2, name: 'Income Stability Pattern' })
    ).toHaveAttribute('id');
    expect(section).toHaveTextContent('Your income trend over the assessment period.');
    expect(screen.getByRole('link', { name: 'Update assessment' })).toHaveAttribute(
      'href',
      '/assessment'
    );
  });
});

describe('DashboardDate', () => {
  it('renders a semantic display from an explicit date without fake filter controls', () => {
    const date = new Date('2026-07-06T12:00:00Z');
    render(<DashboardDate date={date} locale="en-GB" timeZone="Africa/Lagos" />);

    const time = screen.getByText('Monday, 6 July 2026');
    expect(time.tagName).toBe('TIME');
    expect(time).toHaveAttribute('datetime', date.toISOString());
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('renders the truthful unavailable label for an invalid date', () => {
    render(<DashboardDate date={new Date(Number.NaN)} />);

    const time = screen.getByText(UNAVAILABLE_VALUE);
    expect(time.tagName).toBe('TIME');
    expect(time).not.toHaveAttribute('datetime');
  });
});

describe('dashboard async and empty states', () => {
  it('announces stable dashboard loading geometry and disables animation for reduced motion', () => {
    const { container } = render(<DashboardSkeleton />);

    expect(screen.getByRole('status', { name: 'Loading dashboard overview' })).toHaveTextContent(
      'Loading dashboard overview…'
    );
    expect(container.querySelectorAll('[data-dashboard-skeleton="metric"]')).toHaveLength(4);
    expect(
      screen
        .getByRole('status', { name: 'Loading dashboard overview' })
        .querySelector('[aria-hidden="true"]')
    ).toHaveClass('motion-reduce:[&_*]:animate-none');
  });

  it('exposes an alert and keyboard-operable retry action', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <DashboardErrorState
        title="Could not load overview"
        message="Your dashboard data is temporarily unavailable."
        onRetry={onRetry}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Could not load overview');
    const retry = screen.getByRole('button', { name: 'Try again' });
    expect(retry).toHaveClass('min-h-11');
    await user.tab();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('announces an honest empty state and renders a real next action', () => {
    render(
      <DashboardEmptyState
        title="No stability data yet"
        message="Complete your assessment before an income stability pattern can be shown."
        action={<Link href="/assessment">Start assessment</Link>}
      />
    );

    expect(screen.getByRole('status', { name: 'No stability data yet' })).toHaveTextContent(
      'No stability data yet',
    );
    expect(screen.getByRole('link', { name: 'Start assessment' })).toHaveAttribute(
      'href',
      '/assessment'
    );
  });
});
