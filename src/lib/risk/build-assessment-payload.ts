import { z } from 'zod';
import { techAssessmentInputSchema } from '@/lib/validators/risk';
import type { TechAssessmentInput } from '@/types/api';

const booleanAnswerSchema = z.union([
  z.boolean(),
  z.enum(['true', 'false']).transform((value) => value === 'true'),
]);

const wizardAssessmentAnswersSchema = techAssessmentInputSchema.extend({
  pre_existing_conditions: booleanAnswerSchema,
  chronic_illness: booleanAnswerSchema,
  smoker: booleanAnswerSchema,
});

export const assessmentSubmissionSchema = z
  .strictObject({
    category: z.string().trim().min(1),
    payload: techAssessmentInputSchema,
  })
  .superRefine(({ category, payload }, ctx) => {
    if (category !== payload.occupation) {
      ctx.addIssue({
        code: 'custom',
        path: ['payload', 'occupation'],
        message: 'Assessment category must match payload occupation',
      });
    }
  });

export function buildAssessmentPayload(
  answers: Record<string, unknown>,
  category: string
): TechAssessmentInput {
  const payload = wizardAssessmentAnswersSchema.parse(answers);
  return assessmentSubmissionSchema.parse({ category, payload }).payload;
}
