import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  riskQuestionsResponseSchema,
  riskAssessmentResponseSchema,
  riskRecommendationsResponseSchema,
  type RiskQuestion,
  type RiskAssessmentResponse,
  type RiskRecommendation,
  type SubmitAssessmentRequest,
} from '@/lib/validators/risk';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const riskService = {
  async getQuestions(signal?: AbortSignal): Promise<RiskQuestion[]> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.QUESTIONS, { signal });
    return parseOrThrow(riskQuestionsResponseSchema, data, 'riskService.getQuestions');
  },

  async getLatestAssessment(signal?: AbortSignal): Promise<RiskAssessmentResponse> {
    const { data } = await apiClient.get(ENDPOINTS.RISK.ASSESSMENT, { signal });
    return parseOrThrow(riskAssessmentResponseSchema, data, 'riskService.getLatestAssessment');
  },

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
