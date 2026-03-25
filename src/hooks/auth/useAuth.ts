import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import type { LoginRequest, RegisterRequest, WaitlistSignupRequest } from '@/lib/validators/auth';

export function useLogin() {
  const { setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

export function useRegister() {
  const { setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

export function useWaitlistSignup() {
  const { setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: (payload: WaitlistSignupRequest) => authService.waitlistSignup(payload),
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      clearAuth();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: { email: string }) => authService.forgotPassword(payload),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: { token: string; new_password: string }) =>
      authService.resetPassword(payload),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { old_password: string; new_password: string }) =>
      authService.changePassword(payload),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (payload: { token: string }) => authService.verifyEmail(payload),
  });
}

/** Hook to check if user is currently authenticated (has in-memory token) */
export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}

/** Hook to read current auth state */
export function useAuthState() {
  return useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    accessToken: s.accessToken,
  }));
}
