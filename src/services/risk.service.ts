import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { TechAssessmentInput, AssessmentResponse, AssessmentSummary } from '@/types/api';
import {
  assessmentSummarySchema,
  riskAssessmentResponseSchema,
  riskRecommendationsResponseSchema,
  type RiskRecommendation,
} from '@/lib/validators/risk';
import type { RiskQuestionsResponse } from '@/types/risk-assessment';

export type RiskCategory = string | { category: string };

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const riskService = {
  /** Fetch the question bank — no Zod parse needed (shape is loosely typed from API) */
  async getQuestions(category: string, signal?: AbortSignal): Promise<RiskQuestionsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.QUESTIONS, {
      signal,
      params: { category },
    });
    return data as RiskQuestionsResponse;
  },

  async getCategories(signal?: AbortSignal): Promise<RiskCategory[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.CATEGORIES, { signal });
    return data;
  },

  async getLatestAssessment(signal?: AbortSignal): Promise<AssessmentResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.ASSESSMENT, { signal });
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.getLatestAssessment');
  },

  /** Submit a tech freelancer risk assessment — returns full AssessmentResponse */
  async submitTechAssessment(payload: TechAssessmentInput, signal?: AbortSignal): Promise<AssessmentResponse> {
    const { data } = await apiClient.post(
      ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer'),
      payload,
      { signal },
    );
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.submitTechAssessment');
  },

  async getHistory(signal?: AbortSignal): Promise<AssessmentSummary[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.HISTORY, { signal });
    return parseOrThrow(assessmentSummarySchema.array(), data, 'riskService.getHistory');
  },

  async getRecommendations(signal?: AbortSignal): Promise<RiskRecommendation[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.RECOMMENDATIONS, { signal });
    return parseOrThrow(riskRecommendationsResponseSchema, data, 'riskService.getRecommendations');
  },
};
