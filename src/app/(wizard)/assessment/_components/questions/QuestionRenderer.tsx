'use client';

import type { Question } from '@/types/risk-assessment';
import type { Control, FieldErrors } from 'react-hook-form';
import SingleChoiceInput from './SingleChoiceInput';
import MultiChoiceInput from './MultiChoiceInput';
import BooleanInput from './BooleanInput';
import RatingInput from './RatingInput';
import RankingInput from './RankingInput';

interface Props {
  question: Question;
  control: Control<Record<string, unknown>>;
  errors: FieldErrors<Record<string, unknown>>;
}

export default function QuestionRenderer({ question, control, errors }: Props) {
  const error = (errors[question.id]?.message as string) || undefined;

  return (
    <div className="mb-7">
      <p className="font-body text-[14px] font-semibold text-[#0F172A] mb-3 leading-snug">
        {question.text}
      </p>

      {question.type === 'single_choice' && (
        <SingleChoiceInput question={question} control={control} error={error} />
      )}
      {question.type === 'multi_choice' && (
        <MultiChoiceInput question={question} control={control} error={error} />
      )}
      {question.type === 'boolean' && (
        <BooleanInput question={question} control={control} error={error} />
      )}
      {question.type === 'rating' && (
        <RatingInput question={question} control={control} error={error} />
      )}
      {question.type === 'ranking' && (
        <RankingInput question={question} control={control} error={error} />
      )}
    </div>
  );
}
