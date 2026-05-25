import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';
import type {
  ActivateAccountRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResendActivationRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  WaitlistSignupRequest,
} from '@/types/auth';

export function useLogin() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
    retry: false,
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    retry: false,
  });
}

export function useWaitlistSignup() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setUserMeta = useAuthStore((s) => s.setUserMeta);

  return useMutation({
    mutationFn: (payload: WaitlistSignupRequest) => authService.waitlistSignup(payload),
    retry: false,
    onSuccess: (data, variables) => {
      setAccessToken(data.access_token);
      // Store name from form variables (API response may not return them)
      setUserMeta(variables.first_name, variables.last_name ?? null);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: () => authService.logout(),
    retry: false,
    onSettled: () => {
      clearAuth();
    },
  });
}

export function useSilentRefresh() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setAuthInitializing = useAuthStore((s) => s.setAuthInitializing);
  const setUnauthenticated = useAuthStore((s) => s.setUnauthenticated);

  return useMutation({
    mutationFn: () => authService.refresh(),
    retry: false,
    onMutate: () => {
      setAuthInitializing();
    },
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
    onError: () => {
      setUnauthenticated();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: ForgotPasswordRequest) => authService.forgotPassword(payload),
    retry: false,
  });
}

export function useResendActivation() {
  return useMutation({
    mutationFn: (payload: ResendActivationRequest) => authService.resendActivation(payload),
    retry: false,
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) => authService.resetPassword(payload),
    retry: false,
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) => authService.changePassword(payload),
    retry: false,
  });
}

export function useVerifyEmail() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: (payload: VerifyEmailRequest) => authService.verifyEmail(payload),
    retry: false,
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

export function useActivateAccount() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  return useMutation({
    mutationFn: (payload: ActivateAccountRequest) => authService.activateAccount(payload),
    retry: false,
    onSuccess: (data) => {
      setAccessToken(data.access_token);
    },
  });
}

/** Hook to check if user is currently authenticated (has in-memory token) */
export function useIsAuthenticated() {
  return useAuthStore((s) => s.isAuthenticated);
}

/** Hook to read current auth state */
export function useAuthState() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const firstName = useAuthStore((s) => s.firstName);
  const lastName = useAuthStore((s) => s.lastName);
  const status = useAuthStore((s) => s.status);

  return {
    isAuthenticated,
    user,
    accessToken,
    firstName,
    lastName,
    status,
  };
}
