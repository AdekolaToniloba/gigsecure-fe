import { useMutation, useQuery } from '@tanstack/react-query';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';
import { useWizardStore } from '@/store/wizard-store';
import { QUERY_KEYS } from '@/lib/constants';
import type { TechAssessmentInput, AssessmentResponse } from '@/types/api';
import type { RiskQuestionsResponse } from '@/types/risk-assessment';
import type { SubmitAssessmentRequest } from '@/lib/validators/risk';

export function useRiskQuestions(category: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEYS.RISK_QUESTIONS, category],
    queryFn: ({ signal }) => riskService.getQuestions(category as string, signal),
    staleTime: Infinity, // Never refetch during session
    retry: 2,
    enabled: !!category,
  });
}

export function useRiskCategories() {
  return useQuery({
    queryKey: ['risk-categories'],
    queryFn: ({ signal }) => riskService.getCategories(signal),
    staleTime: Infinity,
  });
}

export function useLatestAssessment() {
  return useQuery({
    queryKey: QUERY_KEYS.RISK_ASSESSMENT,
    queryFn: ({ signal }) => riskService.getLatestAssessment(signal),
    staleTime: 0,
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

/** New hook for submitting a tech freelancer assessment */
export function useSubmitTechAssessment() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const resetWizard = useWizardStore((s) => s.reset);

  return useMutation({
    mutationFn: (payload: TechAssessmentInput) =>
      riskService.submitTechAssessment(payload),
    onError: (error: unknown) => {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError?.response?.status === 401) {
        clearAuth();
        resetWizard();
        if (typeof window !== 'undefined') {
          window.location.href = '/waitlist?expired=true';
        }
      }
    },
  });
}

/** Legacy hook (kept for compatibility) */
export function useSubmitAssessment() {
  return useMutation({
    mutationFn: (payload: SubmitAssessmentRequest) => riskService.submitAssessment(payload),
  });
}
