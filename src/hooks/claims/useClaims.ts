import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { claimsService } from '@/services/claims.service';
import { QUERY_KEYS } from '@/lib/constants';
import type { SubmitClaimRequest } from '@/lib/validators/claims';

export function useClaims() {
  return useQuery({
    queryKey: QUERY_KEYS.CLAIMS,
    queryFn: ({ signal }) => claimsService.listClaims(signal),
    staleTime: 0, // Claims status changes frequently
    throwOnError: true,
  });
}

export function useClaim(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CLAIM(id),
    queryFn: ({ signal }) => claimsService.getClaim(id, signal),
    staleTime: 0,
    throwOnError: true,
    enabled: !!id,
  });
}

export function useClaimStatus(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CLAIM_STATUS(id),
    queryFn: ({ signal }) => claimsService.getClaimStatus(id, signal),
    staleTime: 0,
    throwOnError: true,
    enabled: !!id,
  });
}

export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitClaimRequest) => claimsService.submitClaim(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.CLAIMS });
    },
  });
}

export function useUploadClaimDocuments() {
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      claimsService.uploadDocuments(id, formData),
  });
}
