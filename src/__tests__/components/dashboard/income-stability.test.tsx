import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { IncomeStabilityCard } from '@/components/dashboard/overview/income-stability-card';

describe('IncomeStabilityCard', () => {
  it('renders an honest null state without fabricated score, classification, points, or currency labels', () => {
    render(<IncomeStabilityCard stability={null} />);

    const region = screen.getByRole('region', { name: 'Income Stability Pattern' });
    expect(region).toHaveTextContent('No stability data yet');
    expect(region).toHaveTextContent('Complete your risk assessment');
    expect(screen.getByRole('link', { name: 'Start assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );
    expect(screen.queryByRole('img', { name: /stability trend values/i })).not.toBeInTheDocument();
    expect(region).not.toHaveTextContent(/₦|moderate|%/i);
  });

  it('uses every varied point in order and exposes the same values accessibly', async () => {
    const user = userEvent.setup();
    const points = [18, 26, 22, 35, 31, 42, 38, 47];
    const { container } = render(
      <IncomeStabilityCard
        stability={{ score: 42, classification: 'moderate_stability', graph_points: points }}
      />,
    );

    expect(screen.getByText('Moderate Stability — 42%')).toBeInTheDocument();
    expect(screen.getByRole('img', {
      name: 'Stability trend values: 18, 26, 22, 35, 31, 42, 38, 47.',
    })).toHaveAttribute('viewBox', '0 0 640 240');
    expect(container.querySelectorAll('[data-chart-point]')).toHaveLength(points.length);
    expect(screen.getByTestId('income-stability-path').getAttribute('d')).not.toContain('NaN');

    await user.click(screen.getByText('View trend values'));
    const table = screen.getByRole('table', { name: 'Income stability trend observations' });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(points.length);
    points.forEach((point, index) => {
      expect(rows[index]).toHaveTextContent(`${index + 1}`);
      expect(rows[index]).toHaveTextContent(String(point));
    });
  });

  it('renders an empty validated series safely without a path or fabricated observations', async () => {
    const user = userEvent.setup();
    render(
      <IncomeStabilityCard
        stability={{ score: 0, classification: 'Awaiting trend', graph_points: [] }}
      />,
    );

    expect(screen.getByText('Awaiting Trend — 0%')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No trend observations are available');
    expect(screen.queryByTestId('income-stability-path')).not.toBeInTheDocument();
    await user.click(screen.getByText('View trend values'));
    expect(screen.getAllByText('No trend observations are available.')).toHaveLength(1);
  });

  it.each([
    { name: 'single', points: [7], expectedPoints: 1 },
    { name: 'flat', points: [7, 7, 7, 7], expectedPoints: 4 },
  ])('renders a $name series without NaN geometry', ({ points, expectedPoints }) => {
    const { container } = render(
      <IncomeStabilityCard
        stability={{ score: 50, classification: 'Stable', graph_points: points }}
      />,
    );

    expect(container.querySelectorAll('[data-chart-point]')).toHaveLength(expectedPoints);
    expect(screen.getByTestId('income-stability-path').getAttribute('d')).not.toContain('NaN');
  });

  it('keeps long series within responsive containers and preserves all points', () => {
    const points = Array.from({ length: 120 }, (_, index) => (index % 11) * 1.25);
    const { container } = render(
      <IncomeStabilityCard
        stability={{ score: 63, classification: 'Long horizon', graph_points: points }}
      />,
    );

    const region = screen.getByRole('region', { name: 'Income Stability Pattern' });
    const chart = screen.getByRole('img', { name: /stability trend values/i });
    expect(region).toHaveClass('min-w-0', 'overflow-hidden');
    expect(chart).toHaveClass('w-full', 'min-w-0');
    expect(chart).toHaveAttribute('preserveAspectRatio', 'none');
    expect(container.querySelectorAll('[data-chart-point]')).toHaveLength(points.length);
    expect(screen.getByTestId('income-stability-path').getAttribute('d')).not.toContain('NaN');
  });
});
