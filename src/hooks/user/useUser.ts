import { useMutation, useQuery } from '@tanstack/react-query';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';
import { QUERY_KEYS } from '@/lib/constants';
import type { UpdateProfileRequest } from '@/lib/validators/user';

/** Decode JWT payload without verification (client-side introspection only) */
function getTokenScope(token: string | null): string | undefined {
  if (!token) return undefined;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return undefined;
    
    // Convert base64url to standard base64 and pad it
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload).scope;
  } catch (err) {
    console.warn('[JWT] Error parsing token scope:', err);
    return undefined;
  }
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.accessToken);
  const scope = getTokenScope(token);
  // Waitlist-scoped tokens are not authorised for /users/me — skip the call
  const isFullSession = !!token && scope !== 'waitlist';

  return useQuery({
    queryKey: QUERY_KEYS.USER_ME,
    queryFn: ({ signal }) => userService.getMe(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isFullSession,
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
