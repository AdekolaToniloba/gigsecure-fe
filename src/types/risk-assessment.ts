import type {
  assessmentStepSchema,
  riskCategorySchema,
  riskQuestionSchema,
  riskQuestionsResponseSchema,
} from '@/lib/validators/risk';
import type { z } from 'zod';

export type Question = z.infer<typeof riskQuestionSchema>;
export type QuestionType = Question['type'];
export type SingleChoiceQuestion = Extract<Question, { type: 'single_choice' }>;
export type MultiChoiceQuestion = Extract<Question, { type: 'multi_choice' }>;
export type RankingQuestion = Extract<Question, { type: 'ranking' }>;
export type BooleanQuestion = Extract<Question, { type: 'boolean' }>;
export type RatingQuestion = Extract<Question, { type: 'rating' }>;
export type AssessmentStep = z.infer<typeof assessmentStepSchema>;
export type RiskQuestionsResponse = z.infer<typeof riskQuestionsResponseSchema>;
export type RiskCategory = z.infer<typeof riskCategorySchema>;
