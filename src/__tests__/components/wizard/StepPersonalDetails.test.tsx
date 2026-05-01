import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepPersonalDetails from '@/app/(wizard)/assessment/_components/steps/StepPersonalDetails';
import { renderWithProviders } from '../../test-utils';

vi.mock('@/hooks/user/useUser', () => ({
  useCurrentUser: () => ({ data: undefined }),
}));

vi.mock('@/hooks/risk/useRisk', () => ({
  useRiskCategories: () => ({
    data: [{ category: 'Software Engineer' }],
  }),
}));

describe('StepPersonalDetails', () => {
  it('shows Separated in marital status options', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepPersonalDetails />);

    await user.click(screen.getByRole('button', { name: /marital status/i }));
    expect(screen.getByRole('button', { name: 'Separated' })).toBeInTheDocument();
  });

  it('supports searching and keyboard selection in state combobox', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepPersonalDetails />);

    const stateCombobox = screen.getByRole('combobox', { name: /state of residence/i });
    await user.click(stateCombobox);
    await user.type(screen.getByPlaceholderText(/search state/i), 'lag');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(stateCombobox).toHaveTextContent('Lagos');
  });

  it('updates city options based on selected state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepPersonalDetails />);

    const stateCombobox = screen.getByRole('combobox', { name: /state of residence/i });
    await user.click(stateCombobox);
    await user.type(screen.getByPlaceholderText(/search state/i), 'lagos');
    await user.keyboard('{ArrowDown}{Enter}');

    await user.click(screen.getByRole('button', { name: /city/i }));
    expect(screen.getByRole('button', { name: 'Ikeja' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Bwari' })).not.toBeInTheDocument();
  });

  it('clears city when state changes and previous city is invalid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StepPersonalDetails />);

    const stateCombobox = screen.getByRole('combobox', { name: /state of residence/i });

    await user.click(stateCombobox);
    await user.type(screen.getByPlaceholderText(/search state/i), 'lagos');
    await user.keyboard('{ArrowDown}{Enter}');

    await user.click(screen.getByRole('button', { name: /city/i }));
    await user.click(screen.getByRole('button', { name: 'Ikeja' }));
    expect(screen.getByRole('button', { name: /ikeja/i })).toBeInTheDocument();

    await user.click(stateCombobox);
    await user.type(screen.getByPlaceholderText(/search state/i), 'abuja');
    await user.keyboard('{ArrowDown}{Enter}');

    expect(screen.getByRole('button', { name: /city/i })).toHaveTextContent('Select city');
  });
});
