import { z } from 'zod';
import type { AssessmentResponse, AssessmentSummary } from '@/types/api';

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
export const applicantProfileSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  age: z.number(),
  gender: z.string(),
  marital_status: z.string(),
  state: z.string(),
  city: z.string(),
});

export const pillarScoresSchema = z.object({
  income: z.number().min(0).max(100),
  client: z.number().min(0).max(100),
  safety: z.number().min(0).max(100),
  equipment: z.number().min(0).max(100),
  health: z.number().min(0).max(100),
});

export const riskAssessmentResponseSchema: z.ZodType<AssessmentResponse> = z.object({
  applicant: applicantProfileSchema,
  category: z.string(),
  pillar_scores: pillarScoresSchema,
  overall_score: z.number().min(0).max(100),
  risk_profile: z.string(),
  recommendations: z.array(z.string()),
  recommended_categories: z.array(z.string()).optional(),
  ai_insights: z.string(),
});

export const assessmentSummarySchema: z.ZodType<AssessmentSummary> = z.object({
  id: z.string(),
  category: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  age: z.number().int().nullable().optional(),
  overall_score: z.number().min(0).max(100),
  risk_profile: z.string(),
  created_at: z.string(),
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
export type RiskRecommendation = z.infer<typeof riskRecommendationSchema>;
