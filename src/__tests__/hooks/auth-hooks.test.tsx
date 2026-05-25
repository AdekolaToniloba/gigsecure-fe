import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useActivateAccount,
  useForgotPassword,
  useLogin,
  useLogout,
  useRegister,
  useResendActivation,
  useResetPassword,
  useSilentRefresh,
  useVerifyEmail,
  useWaitlistSignup,
} from '@/hooks/auth/useAuth';
import { useSession } from '@/hooks/auth/useSession';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

vi.mock('@/services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    waitlistSignup: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    forgotPassword: vi.fn(),
    resendActivation: vi.fn(),
    resetPassword: vi.fn(),
    changePassword: vi.fn(),
    verifyEmail: vi.fn(),
    activateAccount: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('auth hooks', () => {
  it('sets access token after login success', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'login-token',
      token_type: 'bearer',
    });
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'amaka@example.com',
        password: 'SecurePass123',
      });
    });

    expect(useAuthStore.getState().accessToken).toBe('login-token');
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('does not set access token after register success', async () => {
    vi.mocked(authService.register).mockResolvedValue({
      message: 'Registration successful. Please check your email to verify your account.',
    });
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'amaka@example.com',
        password: 'SecurePass123',
        first_name: 'Amaka',
        last_name: 'Obi',
      });
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('sets waitlist token and non-sensitive name metadata after waitlist signup', async () => {
    vi.mocked(authService.waitlistSignup).mockResolvedValue({
      message: 'Successfully joined the waitlist!',
      user_id: 'user-id',
      access_token: 'waitlist-token',
      token_type: 'bearer',
    });
    const { result } = renderHook(() => useWaitlistSignup(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'amaka@example.com',
        first_name: 'Amaka',
        last_name: 'Obi',
      });
    });

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe('waitlist-token');
    expect(state.firstName).toBe('Amaka');
    expect(state.lastName).toBe('Obi');
  });

  it('sets access token after verify email, activate account, and silent refresh success', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue({
      access_token: 'verified-token',
      token_type: 'bearer',
    });
    vi.mocked(authService.activateAccount).mockResolvedValue({
      access_token: 'activated-token',
      token_type: 'bearer',
    });
    vi.mocked(authService.refresh).mockResolvedValue({
      access_token: 'refreshed-token',
      token_type: 'bearer',
    });

    const verifyHook = renderHook(() => useVerifyEmail(), { wrapper: createWrapper() });
    const activateHook = renderHook(() => useActivateAccount(), { wrapper: createWrapper() });
    const refreshHook = renderHook(() => useSilentRefresh(), { wrapper: createWrapper() });

    await act(async () => {
      await verifyHook.result.current.mutateAsync({ token: 'verify-token' });
    });
    expect(useAuthStore.getState().accessToken).toBe('verified-token');

    await act(async () => {
      await activateHook.result.current.mutateAsync({
        token: 'activate-token',
        password: 'SecurePass123',
      });
    });
    expect(useAuthStore.getState().accessToken).toBe('activated-token');

    await act(async () => {
      await refreshHook.result.current.mutateAsync();
    });
    expect(useAuthStore.getState().accessToken).toBe('refreshed-token');
  });

  it('keeps change and reset-adjacent flows separate and leaves session redirects to UI', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({ message: 'Reset email sent' });
    vi.mocked(authService.resendActivation).mockResolvedValue({
      message: 'If the email is registered, an activation link has been sent.',
    });
    vi.mocked(authService.resetPassword).mockResolvedValue({
      message: 'Password reset successful',
    });

    const forgotHook = renderHook(() => useForgotPassword(), { wrapper: createWrapper() });
    const resendHook = renderHook(() => useResendActivation(), { wrapper: createWrapper() });
    const resetHook = renderHook(() => useResetPassword(), { wrapper: createWrapper() });

    await act(async () => {
      await forgotHook.result.current.mutateAsync({ email: 'amaka@example.com' });
      await resendHook.result.current.mutateAsync({ email: 'amaka@example.com' });
      await resetHook.result.current.mutateAsync({
        token: 'reset-token',
        new_password: 'NewPass123',
      });
    });

    expect(authService.forgotPassword).toHaveBeenCalledTimes(1);
    expect(authService.resendActivation).toHaveBeenCalledTimes(1);
    expect(authService.resetPassword).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('clears local auth state after logout settles', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('access-token');
    });
    vi.mocked(authService.logout).mockResolvedValue({ message: 'Logged out successfully' });
    const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });

  it('does not retry expected auth failures', async () => {
    vi.mocked(authService.login).mockRejectedValue({ detail: 'Invalid credentials' });
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: 'amaka@example.com',
          password: 'wrong-password',
        })
      ).rejects.toEqual({ detail: 'Invalid credentials' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  it('exposes session state and refresh through useSession', async () => {
    vi.mocked(authService.refresh).mockResolvedValue({
      access_token: 'session-token',
      token_type: 'bearer',
    });
    const { result } = renderHook(() => useSession(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.accessToken).toBe('session-token');
    });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.status).toBe('authenticated');
  });
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return Wrapper;
}
