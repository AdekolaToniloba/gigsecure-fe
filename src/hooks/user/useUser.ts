import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/api/errors';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateProfileRequest } from '@/lib/validators/user';
import {
  ASSESSMENT_RELEVANT_PROFILE_FIELDS,
  type AssessmentRelevantProfileField,
} from '@/types/profile';

function hasAssessmentRelevantProfileChanges(payload: UpdateProfileRequest) {
  const changedFields = Object.keys(payload) as AssessmentRelevantProfileField[];
  return changedFields.some((field) =>
    ASSESSMENT_RELEVANT_PROFILE_FIELDS.includes(field),
  );
}

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

type UseUpdateProfileOptions = {
  onSuccess?: (payload: UpdateProfileRequest) => void;
};

export function useUpdateProfile(options: UseUpdateProfileOptions = {}) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setFlags = useAuthStore((s) => s.setFlags);
  const mutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    retry: false,
    onSuccess: (data, payload) => {
      const shouldRefreshAssessmentViews = hasAssessmentRelevantProfileChanges(payload);

      setUser(data.user);
      setFlags({
        kycVerified: data.kyc_verified,
        riskAssessed: data.risk_assessed,
      });

      queryClient.setQueryData(QUERY_KEYS.USER_ME, data);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_ME });

      if (shouldRefreshAssessmentViews) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_ASSESSMENT });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_HISTORY });
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RISK_RECOMMENDATIONS });
        void queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.MARKETPLACE_RECOMMENDATIONS(),
        });
      }

      options.onSuccess?.(payload);
    },
  });

  return {
    ...mutation,
    parsedError: mutation.error ? parseApiError(mutation.error) : null,
  };
}
