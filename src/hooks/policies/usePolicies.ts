import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesService } from '@/services/policies.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreatePolicyRequest } from '@/lib/validators/policies';
import type { PolicyStatusFilter } from '@/types/policies';

export function usePolicySummary() {
  return useQuery({
    queryKey: QUERY_KEYS.POLICIES_SUMMARY,
    queryFn: ({ signal }) => policiesService.getSummary(signal),
    staleTime: 2 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}

export function usePoliciesList(statusFilter?: PolicyStatusFilter | null) {
  return useQuery({
    queryKey: QUERY_KEYS.POLICIES_LIST(statusFilter),
    queryFn: ({ signal }) => policiesService.listPolicies({ statusFilter, signal }),
    staleTime: 2 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}

export function usePolicyDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.POLICY(id ?? ''),
    queryFn: ({ signal }) => policiesService.getPolicy(id as string, signal),
    enabled: Boolean(id),
    staleTime: 2 * 60 * 1000,
    retry: false,
    throwOnError: false,
  });
}

export function usePolicyReportDownload() {
  return useMutation({
    mutationKey: QUERY_KEYS.POLICY_REPORT('download'),
    mutationFn: (policyId: string) => policiesService.downloadPolicyReport(policyId),
    retry: false,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePolicyRequest) => policiesService.createPolicy(payload),
    retry: false,
    onSuccess: (_data, payload) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES_SUMMARY });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES_LIST(null) });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.MARKETPLACE_PRODUCT(payload.product_id) });
    },
  });
}

export const usePolicies = usePoliciesList;
export const usePolicy = usePolicyDetail;
