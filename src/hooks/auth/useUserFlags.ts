import { useAuthStore } from '@/store/auth-store';

export function useUserFlags() {
  const kycVerified = useAuthStore((s) => s.kycVerified);
  const riskAssessed = useAuthStore((s) => s.riskAssessed);
  const hasFullSession = useAuthStore((s) => s.hasFullSession);
  const status = useAuthStore((s) => s.status);
  const hasResolvedFlags = kycVerified !== null && riskAssessed !== null;

  return {
    kycVerified,
    riskAssessed,
    isKycVerified: kycVerified === true,
    isRiskAssessed: riskAssessed === true,
    hasResolvedFlags,
    isLoading: status === 'initializing' || (hasFullSession && !hasResolvedFlags),
    status,
  };
}
