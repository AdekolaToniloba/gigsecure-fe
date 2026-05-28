'use client';

import { useUserFlags } from '@/hooks/auth/useUserFlags';

export function useKycGate() {
  const {
    kycVerified,
    riskAssessed,
    isKycVerified,
    isRiskAssessed,
    hasResolvedFlags,
    isLoading,
    status,
  } = useUserFlags();

  return {
    kycVerified,
    riskAssessed,
    isKycVerified,
    isRiskAssessed,
    hasResolvedFlags,
    isLoading,
    status,
    canProceed: isKycVerified,
  };
}

export type KycGateState = ReturnType<typeof useKycGate>;
