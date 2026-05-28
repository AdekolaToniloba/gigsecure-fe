import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { kycService } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth-store';
import type { KYCVerifyRequest } from '@/lib/validators/kyc';

export function useVerifyKyc() {
  const queryClient = useQueryClient();
  const setFlags = useAuthStore((s) => s.setFlags);

  const mutation = useMutation({
    mutationFn: (payload: KYCVerifyRequest) => kycService.verify(payload),
    retry: false,
    onSuccess: (data) => {
      if (data.status !== 'verified') return;

      setFlags({ kycVerified: true });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.KYC_STATUS });
    },
    throwOnError: false,
  });

  return {
    ...mutation,
    parsedError: mutation.error ? parseApiError(mutation.error) : null,
  };
}

export function useKycStatus() {
  const query = useQuery({
    queryKey: QUERY_KEYS.KYC_STATUS,
    queryFn: ({ signal }) => kycService.getStatus(signal),
    retry: false,
    throwOnError: false,
  });

  return {
    ...query,
    parsedError: query.error ? parseApiError(query.error) : null,
  };
}
