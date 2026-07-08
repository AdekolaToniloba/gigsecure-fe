import { z } from 'zod';
import type {
  AssessmentResponse,
  AssessmentSummary,
  RecommendationsResponse,
  TechAssessmentInput,
} from '@/types/api';

const nonEmptyString = z.string().trim().min(1);
const scoreSchema = z.number().finite().min(0).max(100);
const optionsSchema = z.array(nonEmptyString).min(1);

const singleChoiceQuestionSchema = z.strictObject({
  id: nonEmptyString,
  text: nonEmptyString,
  type: z.literal('single_choice'),
  options: optionsSchema,
});

const multiChoiceQuestionSchema = z.strictObject({
  id: nonEmptyString,
  text: nonEmptyString,
  type: z.literal('multi_choice'),
  options: optionsSchema,
});

const rankingQuestionSchema = z.strictObject({
  id: nonEmptyString,
  text: nonEmptyString,
  type: z.literal('ranking'),
  max_selections: z.number().int().positive(),
  options: optionsSchema,
});

const booleanQuestionSchema = z.strictObject({
  id: nonEmptyString,
  text: nonEmptyString,
  type: z.literal('boolean'),
});

const ratingQuestionSchema = z.strictObject({
  id: nonEmptyString,
  text: nonEmptyString,
  type: z.literal('rating'),
  min: z.number().int(),
  max: z.number().int(),
  labels: z.record(z.string(), nonEmptyString),
});

// The OpenAPI response is intentionally underspecified. This validator is the
// narrow question-bank shape already consumed by the existing wizard.
export const riskQuestionSchema = z
  .discriminatedUnion('type', [
    singleChoiceQuestionSchema,
    multiChoiceQuestionSchema,
    rankingQuestionSchema,
    booleanQuestionSchema,
    ratingQuestionSchema,
  ])
  .superRefine((question, ctx) => {
    if ('options' in question && new Set(question.options).size !== question.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['options'],
        message: 'Question options must be unique',
      });
    }

    if (question.type === 'ranking' && question.max_selections > question.options.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['max_selections'],
        message: 'Maximum selections cannot exceed the available options',
      });
    }

    if (question.type === 'rating') {
      if (question.max < question.min) {
        ctx.addIssue({
          code: 'custom',
          path: ['max'],
          message: 'Rating maximum must be greater than or equal to its minimum',
        });
      }

      for (const labelKey of Object.keys(question.labels)) {
        const value = Number(labelKey);
        if (!Number.isInteger(value) || value < question.min || value > question.max) {
          ctx.addIssue({
            code: 'custom',
            path: ['labels', labelKey],
            message: 'Rating label keys must be integers inside the configured range',
          });
        }
      }
    }
  });

export const assessmentStepSchema = z
  .strictObject({
    step: z.number().int().positive(),
    title: nonEmptyString,
    subtitle: nonEmptyString,
    consent_required: z.boolean().optional(),
    consent_text: nonEmptyString.optional(),
    questions: z.array(riskQuestionSchema).min(1),
  })
  .superRefine((step, ctx) => {
    if (step.consent_required && !step.consent_text) {
      ctx.addIssue({
        code: 'custom',
        path: ['consent_text'],
        message: 'Consent text is required when consent is enabled',
      });
    }

    const ids = step.questions.map((question) => question.id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['questions'],
        message: 'Question IDs must be unique within each step',
      });
    }
  });

export const riskQuestionsResponseSchema = z
  .strictObject({
    category: nonEmptyString,
    title: nonEmptyString,
    description: z.string(),
    steps: z.array(assessmentStepSchema).min(1),
  })
  .superRefine((response, ctx) => {
    const stepNumbers = response.steps.map((step) => step.step);
    if (new Set(stepNumbers).size !== stepNumbers.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['steps'],
        message: 'Assessment step numbers must be unique',
      });
    }

    const questionIds = response.steps.flatMap((step) =>
      step.questions.map((question) => question.id)
    );
    if (new Set(questionIds).size !== questionIds.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['steps'],
        message: 'Question IDs must be unique across the assessment',
      });
    }
  });

export const riskCategoryMetadataSchema = z.strictObject({
  category: nonEmptyString,
  title: nonEmptyString.optional(),
  description: z.string().optional(),
  total_questions: z.number().int().nonnegative().optional(),
  total_steps: z.number().int().nonnegative().optional(),
});

export const riskCategorySchema = z.union([
  nonEmptyString,
  riskCategoryMetadataSchema,
]);

export const riskCategoriesResponseSchema = z.array(riskCategorySchema).min(1);

// ─── Assessment ───────────────────────────────────────────────────
export const applicantProfileSchema = z.strictObject({
  first_name: z.string(),
  last_name: z.string(),
  age: z.number().finite(),
  gender: z.string(),
  marital_status: z.string(),
  state: z.string(),
  city: z.string(),
});

export const pillarScoresSchema = z.strictObject({
  income: scoreSchema,
  client: scoreSchema,
  safety: scoreSchema,
  equipment: scoreSchema,
  health: scoreSchema,
});

export const techAssessmentInputSchema = z.strictObject({
  first_name: nonEmptyString,
  last_name: nonEmptyString,
  date_of_birth: nonEmptyString,
  gender: nonEmptyString,
  state: nonEmptyString,
  city: nonEmptyString,
  occupation: nonEmptyString,
  marital_status: nonEmptyString,
  age: z.number().int().finite().nullable().optional(),
  job_type: nonEmptyString,
  freelance_duration: nonEmptyString,
  client_geography: nonEmptyString,
  work_mode: nonEmptyString,
  weekly_hours: nonEmptyString,
  monthly_income_band: nonEmptyString,
  income_stability: nonEmptyString,
  income_sources: nonEmptyString,
  biggest_client_loss: nonEmptyString,
  past_risks: z.array(nonEmptyString),
  top_worries: z.array(nonEmptyString),
  equipment_dependency: nonEmptyString,
  pre_existing_conditions: z.boolean(),
  chronic_illness: z.boolean(),
  smoker: z.boolean(),
  health_rating: z.number().int().finite().min(1).max(5),
  travel_frequency: nonEmptyString,
  survival_3_months: nonEmptyString,
  savings_duration: nonEmptyString,
  insurance_types: z.array(nonEmptyString),
  insurance_claims: nonEmptyString,
  protection_priority: nonEmptyString,
}) satisfies z.ZodType<TechAssessmentInput>;

export const riskAssessmentResponseSchema = z.strictObject({
  applicant: applicantProfileSchema,
  category: z.string(),
  pillar_scores: pillarScoresSchema,
  overall_score: scoreSchema,
  risk_profile: z.string(),
  recommendations: z.array(z.string()),
  recommended_categories: z.array(z.string()).optional(),
  ai_insights: z.string(),
}) satisfies z.ZodType<AssessmentResponse>;

export const assessmentSummarySchema = z.strictObject({
  id: z.string(),
  category: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  age: z.number().int().finite().nullable().optional(),
  overall_score: scoreSchema,
  risk_profile: z.string(),
  created_at: z.string(),
}) satisfies z.ZodType<AssessmentSummary>;

// ─── Recommendations ──────────────────────────────────────────────
export const riskRecommendationsResponseSchema = z.strictObject({
  recommendations: z.array(z.string()),
  overall_score: scoreSchema.nullable().optional(),
  risk_profile: z.string().nullable().optional(),
}) satisfies z.ZodType<RecommendationsResponse>;

// ─── Inferred Types ────────────────────────────────────────────────
export type RiskQuestion = z.infer<typeof riskQuestionSchema>;
export type RiskCategory = z.infer<typeof riskCategorySchema>;
export type RiskQuestionsResponse = z.infer<typeof riskQuestionsResponseSchema>;
export type RiskRecommendationsResponse = z.infer<typeof riskRecommendationsResponseSchema>;
