import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/api/errors';
import { QUERY_KEYS } from '@/lib/constants';
import { kycService } from '@/services/kyc.service';
import { useAuthStore } from '@/store/auth-store';
import type { KYCVerifyRequest } from '@/lib/validators/kyc';
import type { KycStatus } from '@/types/kyc';

export const KYC_PENDING_FAST_POLL_MS = 3_000;
export const KYC_PENDING_SLOW_POLL_MS = 10_000;
export const KYC_PENDING_FAST_POLL_COUNT = 10;
export const KYC_PENDING_MAX_POLL_COUNT = 37;

export function getKycStatusRefetchInterval(
  status: KycStatus | undefined,
  pendingPollCount: number
) {
  if (status !== 'pending') return false;
  if (pendingPollCount >= KYC_PENDING_MAX_POLL_COUNT) return false;
  return pendingPollCount < KYC_PENDING_FAST_POLL_COUNT
    ? KYC_PENDING_FAST_POLL_MS
    : KYC_PENDING_SLOW_POLL_MS;
}

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

export function usePollingKycStatus() {
  const queryClient = useQueryClient();
  const setFlags = useAuthStore((s) => s.setFlags);
  const [pendingPollCount, setPendingPollCount] = useState(0);

  const query = useQuery({
    queryKey: QUERY_KEYS.KYC_STATUS,
    queryFn: ({ signal }) => kycService.getStatus(signal),
    retry: false,
    throwOnError: false,
    refetchInterval: (currentQuery) => {
      const pendingPollCount =
        currentQuery.state.data?.status === 'pending'
          ? currentQuery.state.dataUpdateCount
          : 0;
      setPendingPollCount((currentCount) =>
        currentCount === pendingPollCount ? currentCount : pendingPollCount
      );

      return getKycStatusRefetchInterval(
        currentQuery.state.data?.status,
        pendingPollCount
      );
    },
  });

  useEffect(() => {
    if (!query.data) return;

    if (query.data.status === 'verified') {
      setFlags({ kycVerified: true });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME });
    }
  }, [query.data, queryClient, setFlags]);

  return {
    ...query,
    pendingPollCount,
    hasPendingPollingTimedOut:
      query.data?.status === 'pending' &&
      pendingPollCount >= KYC_PENDING_MAX_POLL_COUNT,
    parsedError: query.error ? parseApiError(query.error) : null,
  };
}
