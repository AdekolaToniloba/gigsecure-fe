import { useMutation, useQuery } from '@tanstack/react-query';
import { riskService } from '@/services/risk.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { SubmitAssessmentRequest } from '@/lib/validators/risk';

export function useRiskQuestions() {
  return useQuery({
    queryKey: QUERY_KEYS.RISK_QUESTIONS,
    queryFn: ({ signal }) => riskService.getQuestions(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function useLatestAssessment() {
  return useQuery({
    queryKey: QUERY_KEYS.RISK_ASSESSMENT,
    queryFn: ({ signal }) => riskService.getLatestAssessment(signal),
    staleTime: 0, // Always fresh
    throwOnError: true,
  });
}

export function useAssessmentHistory() {
  return useQuery({
    queryKey: QUERY_KEYS.RISK_HISTORY,
    queryFn: ({ signal }) => riskService.getHistory(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function useRiskRecommendations() {
  return useQuery({
    queryKey: QUERY_KEYS.RISK_RECOMMENDATIONS,
    queryFn: ({ signal }) => riskService.getRecommendations(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function useSubmitAssessment() {
  return useMutation({
    mutationFn: (payload: SubmitAssessmentRequest) => riskService.submitAssessment(payload),
  });
}
