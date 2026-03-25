import { z } from 'zod';

// ─── Question ─────────────────────────────────────────────────────
export const riskQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(['single_choice', 'multiple_choice', 'text', 'number']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export const riskQuestionsResponseSchema = z.array(riskQuestionSchema);

// ─── Assessment ───────────────────────────────────────────────────
export const riskAssessmentAnswerSchema = z.object({
  question_id: z.string(),
  answer: z.union([z.string(), z.array(z.string()), z.number()]),
});

export const submitAssessmentRequestSchema = z.object({
  answers: z.array(riskAssessmentAnswerSchema),
});

export const riskScoreSchema = z.object({
  score: z.number(),
  level: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
});

export const riskAssessmentResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  score: riskScoreSchema.optional(),
  completed_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

// ─── Recommendations ──────────────────────────────────────────────
export const riskRecommendationSchema = z.object({
  product_id: z.string(),
  reason: z.string(),
  priority: z.number().int().optional(),
});

export const riskRecommendationsResponseSchema = z.array(riskRecommendationSchema);

// ─── Inferred Types ────────────────────────────────────────────────
export type RiskQuestion = z.infer<typeof riskQuestionSchema>;
export type SubmitAssessmentRequest = z.infer<typeof submitAssessmentRequestSchema>;
export type RiskAssessmentResponse = z.infer<typeof riskAssessmentResponseSchema>;
export type RiskRecommendation = z.infer<typeof riskRecommendationSchema>;
