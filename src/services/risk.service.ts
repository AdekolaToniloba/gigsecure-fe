import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import type { TechAssessmentInput, AssessmentResponse } from '@/types/api';
import {
  riskQuestionsResponseSchema,
  riskAssessmentResponseSchema,
  riskRecommendationsResponseSchema,
  type SubmitAssessmentRequest,
  type RiskAssessmentResponse,
  type RiskRecommendation,
} from '@/lib/validators/risk';
import type { RiskQuestionsResponse } from '@/types/risk-assessment';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

const ASSESSMENT_SUBMISSION_ENDPOINT = '/api/v1/risk/assessment/tech_freelancer';

export const riskService = {
  /** Fetch the question bank — no Zod parse needed (shape is loosely typed from API) */
  async getQuestions(category: string, signal?: AbortSignal): Promise<RiskQuestionsResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.QUESTIONS, {
      signal,
      params: { category },
    });
    return data as RiskQuestionsResponse;
  },

  async getCategories(signal?: AbortSignal): Promise<any[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.CATEGORIES, { signal });
    return data;
  },

  async getLatestAssessment(signal?: AbortSignal): Promise<RiskAssessmentResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.ASSESSMENT, { signal });
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.getLatestAssessment');
  },

  /** Submit a tech freelancer risk assessment — returns full AssessmentResponse */
  async submitTechAssessment(payload: TechAssessmentInput, signal?: AbortSignal): Promise<AssessmentResponse> {
    const { data } = await apiClient.post(ASSESSMENT_SUBMISSION_ENDPOINT, payload, { signal });
    return data as AssessmentResponse;
  },

  /** Legacy: submit assessment with old shape (kept for compatibility) */
  async submitAssessment(payload: SubmitAssessmentRequest, signal?: AbortSignal): Promise<RiskAssessmentResponse> {
    const { data } = await apiClient.post(ENDPOINTS.RISK.ASSESSMENT, payload, { signal });
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.submitAssessment');
  },

  async getHistory(signal?: AbortSignal): Promise<RiskAssessmentResponse[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.HISTORY, { signal });
    return parseOrThrow(riskAssessmentResponseSchema.array(), data, 'riskService.getHistory');
  },

  async getRecommendations(signal?: AbortSignal): Promise<RiskRecommendation[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.RECOMMENDATIONS, { signal });
    return parseOrThrow(riskRecommendationsResponseSchema, data, 'riskService.getRecommendations');
  },
};
