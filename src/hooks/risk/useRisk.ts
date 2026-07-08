import { useMutation, useQuery } from '@tanstack/react-query';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS } from '@/lib/constants';
import { parseApiError } from '@/lib/api/errors';
import type { TechAssessmentInput } from '@/types/api';

export const LATEST_ASSESSMENT_STALE_TIME = 5 * 60 * 1000;

type RiskQueryOptions = {
  enabled?: boolean;
};

export type RiskAssessmentSubmission = {
  category: string;
  payload: TechAssessmentInput;
  signal?: AbortSignal;
};

export function useRiskQuestions(
  category: string | null,
  { enabled = true }: RiskQueryOptions = {},
) {
  const hasAccessToken = useAuthStore((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: QUERY_KEYS.RISK_QUESTIONS(category ?? ''),
    queryFn: ({ signal }) => riskService.getQuestions(category as string, signal),
    staleTime: Infinity,
    retry: false,
    enabled: enabled && hasAccessToken && Boolean(category),
  });

  return { ...query, parsedError: query.error ? parseApiError(query.error) : null };
}

export function useRiskCategories({ enabled = true }: RiskQueryOptions = {}) {
  const hasAccessToken = useAuthStore((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: QUERY_KEYS.RISK_CATEGORIES,
    queryFn: ({ signal }) => riskService.getCategories(signal),
    staleTime: Infinity,
    retry: false,
    enabled: enabled && hasAccessToken,
  });

  return { ...query, parsedError: query.error ? parseApiError(query.error) : null };
}

export function useLatestAssessment({ enabled = true }: { enabled?: boolean } = {}) {
  const hasAccessToken = useAuthStore((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: QUERY_KEYS.RISK_ASSESSMENT,
    queryFn: ({ signal }) => riskService.getLatestAssessment(signal),
    enabled: enabled && hasAccessToken,
    staleTime: LATEST_ASSESSMENT_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });

  return { ...query, parsedError: query.error ? parseApiError(query.error) : null };
}

export function useAssessmentHistory({ enabled = true }: RiskQueryOptions = {}) {
  const hasAccessToken = useAuthStore((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: QUERY_KEYS.RISK_HISTORY,
    queryFn: ({ signal }) => riskService.getHistory(signal),
    enabled: enabled && hasAccessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });

  return { ...query, parsedError: query.error ? parseApiError(query.error) : null };
}

export function useRiskRecommendations({ enabled = true }: RiskQueryOptions = {}) {
  const hasAccessToken = useAuthStore((state) => Boolean(state.accessToken));
  const query = useQuery({
    queryKey: QUERY_KEYS.RISK_RECOMMENDATIONS,
    queryFn: ({ signal }) => riskService.getRecommendations(signal),
    enabled: enabled && hasAccessToken,
    staleTime: 5 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });

  return { ...query, parsedError: query.error ? parseApiError(query.error) : null };
}

export function useSubmitTechAssessment() {
  const mutation = useMutation({
    mutationFn: ({ category, payload, signal }: RiskAssessmentSubmission) =>
      riskService.submitAssessment(category, payload, signal),
    retry: false,
  });

  return {
    ...mutation,
    parsedError: mutation.error ? parseApiError(mutation.error) : null,
  };
}
