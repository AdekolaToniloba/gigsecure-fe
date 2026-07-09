import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateProfileRequest } from '@/lib/validators/user';

export function useCurrentUser({ enabled = true }: { enabled?: boolean } = {}) {
  const hasFullSession = useAuthStore((s) => s.hasFullSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setFlags = useAuthStore((s) => s.setFlags);

  return useQuery({
    queryKey: QUERY_KEYS.USER_ME,
    queryFn: async ({ signal }) => {
      const data = await userService.getMe(signal);
      setUser(data.user);
      setFlags({
        kycVerified: data.kyc_verified,
        riskAssessed: data.risk_assessed,
      });
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && hasFullSession,
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  const setFlags = useAuthStore((s) => s.setFlags);

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    onSuccess: (data) => {
      setUser(data.user);
      setFlags({
        kycVerified: data.kyc_verified,
        riskAssessed: data.risk_assessed,
      });
    },
  });
}
