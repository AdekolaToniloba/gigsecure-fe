import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { policiesService } from '@/services/policies.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { CreatePolicyRequest } from '@/lib/validators/policies';

export function usePolicies() {
  return useQuery({
    queryKey: QUERY_KEYS.POLICIES,
    queryFn: ({ signal }) => policiesService.listPolicies(signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
  });
}

export function usePolicy(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.POLICY(id),
    queryFn: ({ signal }) => policiesService.getPolicy(id, signal),
    staleTime: 5 * 60 * 1000,
    throwOnError: true,
    enabled: !!id,
  });
}

export function useCreatePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePolicyRequest) => policiesService.createPolicy(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES });
    },
  });
}

export function useCancelPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policiesService.cancelPolicy(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICY(id) });
    },
  });
}

export function useRenewPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => policiesService.renewPolicy(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICIES });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.POLICY(id) });
    },
  });
}
