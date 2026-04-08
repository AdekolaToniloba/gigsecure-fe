import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import SingleChoiceInput from '@/app/(wizard)/assessment/_components/questions/SingleChoiceInput';
import MultiChoiceInput from '@/app/(wizard)/assessment/_components/questions/MultiChoiceInput';
import BooleanInput from '@/app/(wizard)/assessment/_components/questions/BooleanInput';
import RatingInput from '@/app/(wizard)/assessment/_components/questions/RatingInput';
import type { SingleChoiceQuestion, MultiChoiceQuestion, BooleanQuestion, RatingQuestion } from '@/types/risk-assessment';

// Wrapper to provide RHF control
function FormWrapper({ children, defaultValues = {} }: { children: (control: any) => React.ReactNode; defaultValues?: Record<string, unknown> }) {
  const form = useForm({ defaultValues });
  return <FormProvider {...form}><form>{children(form.control)}</form></FormProvider>;
}

// ─── SingleChoiceInput ────────────────────────────────────────────

const singleQ: SingleChoiceQuestion = {
  id: 'q_single',
  text: 'What type of work?',
  type: 'single_choice',
  options: ['Web Dev', 'Mobile Dev', 'DevOps'],
};

describe('SingleChoiceInput', () => {
  it('renders all options as radio buttons', () => {
    render(
      <FormWrapper>
        {(control) => <SingleChoiceInput question={singleQ} control={control} />}
      </FormWrapper>
    );
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByText('Web Dev')).toBeInTheDocument();
    expect(screen.getByText('Mobile Dev')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
  });

  it('clicking an option selects it', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper>
        {(control) => <SingleChoiceInput question={singleQ} control={control} />}
      </FormWrapper>
    );
    await user.click(screen.getByText('Mobile Dev'));
    const selected = screen.getByRole('radio', { name: /Mobile Dev/i });
    expect(selected).toHaveAttribute('aria-checked', 'true');
  });

  it('only one option selected at a time', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper>
        {(control) => <SingleChoiceInput question={singleQ} control={control} />}
      </FormWrapper>
    );
    await user.click(screen.getByText('Web Dev'));
    await user.click(screen.getByText('DevOps'));
    const radios = screen.getAllByRole('radio');
    const checkedRadios = radios.filter((r) => r.getAttribute('aria-checked') === 'true');
    expect(checkedRadios).toHaveLength(1);
  });

  it('shows error message when provided', () => {
    render(
      <FormWrapper>
        {(control) => <SingleChoiceInput question={singleQ} control={control} error="Please select" />}
      </FormWrapper>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Please select');
  });
});

// ─── MultiChoiceInput ─────────────────────────────────────────────

const multiQ: MultiChoiceQuestion = {
  id: 'q_multi',
  text: 'Which risks?',
  type: 'multi_choice',
  options: ['Late payments', 'Equipment failure', 'Data loss'],
};

describe('MultiChoiceInput', () => {
  it('renders options as checkboxes', () => {
    render(
      <FormWrapper defaultValues={{ q_multi: [] }}>
        {(control) => <MultiChoiceInput question={multiQ} control={control} />}
      </FormWrapper>
    );
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
  });

  it('toggles selection on click', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper defaultValues={{ q_multi: [] }}>
        {(control) => <MultiChoiceInput question={multiQ} control={control} />}
      </FormWrapper>
    );
    const option = screen.getByRole('checkbox', { name: /Late payments/i });
    await user.click(option);
    expect(option).toHaveAttribute('aria-checked', 'true');
    await user.click(option);
    expect(option).toHaveAttribute('aria-checked', 'false');
  });

  it('allows multiple selections', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper defaultValues={{ q_multi: [] }}>
        {(control) => <MultiChoiceInput question={multiQ} control={control} />}
      </FormWrapper>
    );
    await user.click(screen.getByText('Late payments'));
    await user.click(screen.getByText('Data loss'));
    const checkboxes = screen.getAllByRole('checkbox');
    const checked = checkboxes.filter((cb) => cb.getAttribute('aria-checked') === 'true');
    expect(checked).toHaveLength(2);
  });

  it('shows error when provided', () => {
    render(
      <FormWrapper defaultValues={{ q_multi: [] }}>
        {(control) => <MultiChoiceInput question={multiQ} control={control} error="Select at least one" />}
      </FormWrapper>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Select at least one');
  });
});

// ─── BooleanInput ─────────────────────────────────────────────────

const boolQ: BooleanQuestion = {
  id: 'q_bool',
  text: 'Pre-existing conditions?',
  type: 'boolean',
};

describe('BooleanInput', () => {
  it('renders Yes and No options', () => {
    render(
      <FormWrapper>
        {(control) => <BooleanInput question={boolQ} control={control} />}
      </FormWrapper>
    );
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('clicking selects the option', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper>
        {(control) => <BooleanInput question={boolQ} control={control} />}
      </FormWrapper>
    );
    await user.click(screen.getByText('Yes'));
    const radios = screen.getAllByRole('radio');
    const yesRadio = radios.find((r) => r.getAttribute('aria-checked') === 'true');
    expect(yesRadio).toBeDefined();
  });

  it('shows error when provided', () => {
    render(
      <FormWrapper>
        {(control) => <BooleanInput question={boolQ} control={control} error="Required" />}
      </FormWrapper>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});

// ─── RatingInput ──────────────────────────────────────────────────

const ratingQ: RatingQuestion = {
  id: 'q_rating',
  text: 'Rate your health',
  type: 'rating',
  min: 1,
  max: 5,
  labels: { '1': 'Poor', '3': 'Average', '5': 'Excellent' },
};

describe('RatingInput', () => {
  it('renders correct number of rating buttons', () => {
    render(
      <FormWrapper>
        {(control) => <RatingInput question={ratingQ} control={control} />}
      </FormWrapper>
    );
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(5); // 1,2,3,4,5
  });

  it('shows labels where provided', () => {
    render(
      <FormWrapper>
        {(control) => <RatingInput question={ratingQ} control={control} />}
      </FormWrapper>
    );
    expect(screen.getByText('Poor')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('clicking selects the rating value', async () => {
    const user = userEvent.setup();
    render(
      <FormWrapper>
        {(control) => <RatingInput question={ratingQ} control={control} />}
      </FormWrapper>
    );
    await user.click(screen.getByRole('radio', { name: /3 – Average/i }));
    expect(screen.getByRole('radio', { name: /3 – Average/i })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows error when provided', () => {
    render(
      <FormWrapper>
        {(control) => <RatingInput question={ratingQ} control={control} error="Please rate" />}
      </FormWrapper>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Please rate');
  });
});
