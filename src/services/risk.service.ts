import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type {
  TechAssessmentInput,
  AssessmentResponse,
  AssessmentSummary,
  RecommendationsResponse,
} from '@/types/api';
import {
  assessmentSummarySchema,
  riskCategoriesResponseSchema,
  riskAssessmentResponseSchema,
  riskQuestionsResponseSchema,
  riskRecommendationsResponseSchema,
} from '@/lib/validators/risk';
import { assessmentSubmissionSchema } from '@/lib/risk/build-assessment-payload';
import type { RiskCategory, RiskQuestionsResponse } from '@/types/risk-assessment';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const riskService = {
  async getQuestions(category: string, signal?: AbortSignal): Promise<RiskQuestionsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.QUESTIONS, {
      signal,
      params: { category },
    });
    return parseOrThrow(riskQuestionsResponseSchema, data, 'riskService.getQuestions');
  },

  async getCategories(signal?: AbortSignal): Promise<RiskCategory[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.CATEGORIES, { signal });
    return parseOrThrow(riskCategoriesResponseSchema, data, 'riskService.getCategories');
  },

  async getLatestAssessment(signal?: AbortSignal): Promise<AssessmentResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.ASSESSMENT, { signal });
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.getLatestAssessment');
  },

  async submitAssessment(
    category: string,
    payload: TechAssessmentInput,
    signal?: AbortSignal,
  ): Promise<AssessmentResponse> {
    const submission = assessmentSubmissionSchema.parse({ category, payload });
    const { data, status } = await apiClient.post(
      ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY(submission.category),
      submission.payload,
      { signal },
    );
    if (status !== 201) {
      throw new Error('Invalid API response status in riskService.submitAssessment');
    }
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.submitAssessment');
  },

  async getHistory(signal?: AbortSignal): Promise<AssessmentSummary[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.HISTORY, { signal });
    return parseOrThrow(assessmentSummarySchema.array(), data, 'riskService.getHistory');
  },

  async getRecommendations(signal?: AbortSignal): Promise<RecommendationsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.RECOMMENDATIONS, { signal });
    return parseOrThrow(riskRecommendationsResponseSchema, data, 'riskService.getRecommendations');
  },
};
