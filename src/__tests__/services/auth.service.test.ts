import { act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth-store';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('authService', () => {
  it('registers through the BFF and returns only the registration message', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        message: 'Registration successful. Please check your email to verify your account.',
      })
    );

    await expect(
      authService.register({
        email: 'amaka@example.com',
        password: 'SecurePass123',
        first_name: 'Amaka',
        last_name: 'Obi',
      })
    ).resolves.toEqual({
      message: 'Registration successful. Please check your email to verify your account.',
    });

    expect(fetch).toHaveBeenCalledWith('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        email: 'amaka@example.com',
        password: 'SecurePass123',
        first_name: 'Amaka',
        last_name: 'Obi',
      }),
      signal: undefined,
    });
  });

  it('logs in through the BFF and parses a browser-safe token response', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        access_token: 'access-token',
        token_type: 'bearer',
      })
    );

    const result = await authService.login({
      email: 'amaka@example.com',
      password: 'SecurePass123',
    });

    expect(result).toEqual({
      access_token: 'access-token',
      token_type: 'bearer',
    });
    expect('refresh_token' in result).toBe(false);
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uses BFF routes for verify email, activate account, refresh, and resend activation', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ access_token: 'verified-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'activated-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ access_token: 'refreshed-token', token_type: 'bearer' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'If the email is registered, an activation link has been sent.' }));

    await expect(authService.verifyEmail({ token: 'verify-token' })).resolves.toMatchObject({
      access_token: 'verified-token',
    });
    await expect(
      authService.activateAccount({ token: 'activate-token', password: 'SecurePass123' })
    ).resolves.toMatchObject({ access_token: 'activated-token' });
    await expect(authService.refresh()).resolves.toMatchObject({
      access_token: 'refreshed-token',
    });
    await expect(authService.resendActivation({ email: 'amaka@example.com' })).resolves.toMatchObject({
      message: 'If the email is registered, an activation link has been sent.',
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/auth/verify-email',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auth/activate',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      '/api/auth/refresh',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      4,
      '/api/auth/resend-activation',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uses unauthenticated BFF password reset routes', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ message: 'Reset email sent' }))
      .mockResolvedValueOnce(jsonResponse({ message: 'Password reset successful' }));

    await expect(authService.forgotPassword({ email: 'amaka@example.com' })).resolves.toEqual({
      message: 'Reset email sent',
    });
    await expect(
      authService.resetPassword({ token: 'reset-token', new_password: 'NewPass123' })
    ).resolves.toEqual({ message: 'Password reset successful' });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/auth/forgot-password',
      expect.objectContaining({ method: 'POST' })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/auth/reset-password',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('changes password through the BFF with the in-memory Bearer token', async () => {
    act(() => {
      useAuthStore.getState().setAccessToken('access-token');
    });
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ message: 'Password changed successfully' })
    );

    await expect(
      authService.changePassword({
        old_password: 'OldPass123',
        new_password: 'NewPass123',
      })
    ).resolves.toEqual({ message: 'Password changed successfully' });

    expect(fetch).toHaveBeenCalledWith('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        Authorization: 'Bearer access-token',
      },
      body: JSON.stringify({
        old_password: 'OldPass123',
        new_password: 'NewPass123',
      }),
      signal: undefined,
    });
  });

  it('throws the parsed API body for expected 4xx errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ detail: 'Invalid credentials' }, { status: 401 })
    );

    await expect(
      authService.login({ email: 'amaka@example.com', password: 'wrong-password' })
    ).rejects.toEqual({ detail: 'Invalid credentials' });
  });
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
