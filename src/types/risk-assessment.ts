// ─── Hand-maintained question bank types (not generated) ─────────

export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'ranking'
  | 'boolean'
  | 'rating';

interface BaseQuestion {
  id: string;
  text: string;
  type: QuestionType;
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: 'single_choice';
  options: string[];
}

export interface MultiChoiceQuestion extends BaseQuestion {
  type: 'multi_choice';
  options: string[];
}

export interface RankingQuestion extends BaseQuestion {
  type: 'ranking';
  max_selections: number;
  options: string[];
}

export interface BooleanQuestion extends BaseQuestion {
  type: 'boolean';
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  min: number;
  max: number;
  labels: Record<string, string>;
}

export type Question =
  | SingleChoiceQuestion
  | MultiChoiceQuestion
  | RankingQuestion
  | BooleanQuestion
  | RatingQuestion;

export interface AssessmentStep {
  step: number;
  title: string;
  subtitle: string;
  consent_required?: boolean;
  consent_text?: string;
  questions: Question[];
}

export interface RiskQuestionsResponse {
  category: string;
  title: string;
  description: string;
  steps: AssessmentStep[];
}
