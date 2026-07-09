import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PremiumsOverviewCard } from '@/components/dashboard/premiums/premiums-overview-card';

describe('PremiumsOverviewCard', () => {
  it('renders summary metrics from PolicySummary', () => {
    render(
      <PremiumsOverviewCard
        summary={{ total_coverage: '690000', active_count: 2, due_soon_count: 1 }}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Your Protection Overview' })).toBeVisible();
    expect(screen.getByText('Total Coverage')).toBeVisible();
    expect(screen.getByText('₦690,000.00')).toBeVisible();
    expect(screen.getByText('Active Plans')).toBeVisible();
    expect(screen.getByText('2')).toBeVisible();
    expect(screen.getByText('Due Soon')).toBeVisible();
    expect(screen.getByText('1')).toBeVisible();
    expect(screen.getByText(/summary contract does not include a currency field/i)).toBeInTheDocument();
  });

  it('renders zero values correctly', () => {
    render(
      <PremiumsOverviewCard
        summary={{ total_coverage: '0', active_count: 0, due_soon_count: 0 }}
      />,
    );

    expect(screen.getByText('₦0.00')).toBeVisible();
    expect(screen.getAllByText('0')).toHaveLength(2);
  });

  it('reserves stable loading geometry', () => {
    render(<PremiumsOverviewCard isLoading />);

    expect(screen.getByRole('status', { name: 'Loading protection overview' })).toBeVisible();
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(3);
  });

  it('renders accessible error and retry state', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <PremiumsOverviewCard
        errorMessage="Policy summary is temporarily unavailable."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Policy summary is temporarily unavailable.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
