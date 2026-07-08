import { beforeEach, describe, expect, it } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StepPersonalDetails from '@/app/(wizard)/assessment/_components/steps/StepPersonalDetails';
import { renderWithProviders } from '../../test-utils';
import { useWizardStore } from '@/store/wizard-store';

describe('StepPersonalDetails', () => {
  beforeEach(() => {
    act(() => {
      useWizardStore.getState().reset('public');
      useWizardStore.getState().reset('dashboard');
      useWizardStore.getState().setMode('public');
    });
  });

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

  it('uses defaults supplied by the public adapter', () => {
    renderWithProviders(<StepPersonalDetails initialDefaults={{ first_name: 'Waitlist', last_name: 'User' }} />);

    expect(screen.getByRole('textbox', { name: /first-name/i })).toHaveValue('Waitlist');
    expect(screen.getByRole('textbox', { name: /last-name/i })).toHaveValue('User');
  });

  it('prefills supported dashboard profile values once and keeps them editable', async () => {
    const user = userEvent.setup();
    const defaults = { first_name: 'Profile', last_name: 'Person', date_of_birth: '09/04/1992', gender: 'female', state: 'Lagos', city: 'Ikeja', occupation: 'Software Engineer' };
    act(() => useWizardStore.getState().setMode('dashboard'));

    const { rerender } = renderWithProviders(<StepPersonalDetails initialDefaults={defaults} categories={[{ category: 'Software Engineer' }]} />);

    const firstName = screen.getByRole('textbox', { name: /first-name/i });
    expect(firstName).toHaveValue('Profile');
    expect(firstName).toBeEnabled();
    expect(screen.getByRole('textbox', { name: /last-name/i })).toHaveValue('Person');
    expect(screen.getByRole('button', { name: /date of birth/i })).toHaveTextContent('09/04/1992');
    expect(screen.getByRole('button', { name: /gender/i })).toHaveTextContent('Female');
    expect(screen.getByRole('combobox', { name: /state of residence/i })).toHaveTextContent('Lagos');
    expect(screen.getByRole('button', { name: /city/i })).toHaveTextContent('Ikeja');
    expect(screen.getByRole('button', { name: /occupation/i })).toHaveTextContent('Software Engineer');
    expect(screen.getByRole('button', { name: /marital status/i })).toHaveTextContent('Select marital status');

    await user.clear(firstName);
    await user.type(firstName, 'Edited');
    expect(firstName).toHaveValue('Edited');
    rerender(<StepPersonalDetails initialDefaults={{ ...defaults, first_name: 'Replacement' }} categories={[{ category: 'Software Engineer' }]} />);
    expect(firstName).toHaveValue('Edited');
  });

  it('keeps resumed dashboard answers ahead of profile defaults', () => {
    act(() => {
      useWizardStore.getState().setMode('dashboard');
      useWizardStore.getState().setStepAnswers({
        first_name: 'Resumed',
        state: 'Abuja',
        city: 'Bwari',
      });
    });

    renderWithProviders(<StepPersonalDetails initialDefaults={{ first_name: 'Profile', last_name: 'Person', state: 'Lagos', city: 'Ikeja' }} />);

    expect(screen.getByRole('textbox', { name: /first-name/i })).toHaveValue('Resumed');
    expect(screen.getByRole('combobox', { name: /state of residence/i })).toHaveTextContent('Abuja');
    expect(screen.getByRole('button', { name: /city/i })).toHaveTextContent('Bwari');
  });

  it('keeps fields usable when no dashboard defaults are available', () => {
    act(() => useWizardStore.getState().setMode('dashboard'));

    renderWithProviders(<StepPersonalDetails categories={[{ category: 'Software Engineer' }]} />);

    expect(screen.getByRole('textbox', { name: /first-name/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /occupation/i })).toBeEnabled();
  });
});
