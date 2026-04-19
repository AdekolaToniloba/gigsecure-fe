import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateProfileRequest } from '@/lib/validators/user';

export function useCurrentUser() {
  return useQuery({
    queryKey: QUERY_KEYS.USER_ME,
    queryFn: ({ signal }) => userService.getMe(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userService.updateProfile(payload),
    onSuccess: (data) => {
      setUser(data.user);
    },
  });
}
