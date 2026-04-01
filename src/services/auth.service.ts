import { apiClient } from '@/lib/api/client';
import { AUTH_ENDPOINTS } from '@/lib/api/endpoints';
import {
  tokenResponseSchema,
  waitlistSignupResponseSchema,
  type LoginRequest,
  type RegisterRequest,
  type WaitlistSignupRequest,
  type ForgotPasswordRequest,
  type ResetPasswordRequest,
  type ChangePasswordRequest,
  type VerifyEmailRequest,
  type ActivateAccountRequest,
} from '@/lib/validators/auth';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

async function safeJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || res.statusText };
  }
}

/** All auth calls go through BFF routes — never directly to the backend */
export const authService = {
  async login(payload: LoginRequest, signal?: AbortSignal) {
    const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
      signal,
    });
    const data = await safeJson(res);
    if (!res.ok) throw data;
    return parseOrThrow(tokenResponseSchema, data, 'authService.login');
  },

  async register(payload: RegisterRequest, signal?: AbortSignal) {
    const res = await fetch(AUTH_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
      signal,
    });
    const data = await safeJson(res);
    if (!res.ok) throw data;
    return parseOrThrow(tokenResponseSchema, data, 'authService.register');
  },

  async waitlistSignup(payload: WaitlistSignupRequest, signal?: AbortSignal) {
    const res = await fetch(AUTH_ENDPOINTS.WAITLIST, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(payload),
      signal,
    });
    const data = await safeJson(res);
    if (!res.ok) throw data;
    return parseOrThrow(waitlistSignupResponseSchema, data, 'authService.waitlistSignup');
  },

  async logout(signal?: AbortSignal) {
    await fetch(AUTH_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal,
    });
  },

  async forgotPassword(payload: ForgotPasswordRequest, signal?: AbortSignal) {
    const { data } = await apiClient.post('/api/v1/auth/forgot-password', payload, { signal });
    return data;
  },

  async resetPassword(payload: ResetPasswordRequest, signal?: AbortSignal) {
    const { data } = await apiClient.post('/api/v1/auth/reset-password', payload, { signal });
    return data;
  },

  async changePassword(payload: ChangePasswordRequest, signal?: AbortSignal) {
    const { data } = await apiClient.put('/api/v1/auth/change-password', payload, { signal });
    return data;
  },

  async verifyEmail(payload: VerifyEmailRequest, signal?: AbortSignal) {
    const { data } = await apiClient.post('/api/v1/auth/verify-email', payload, { signal });
    return data;
  },

  async activateAccount(payload: ActivateAccountRequest, signal?: AbortSignal) {
    const { data } = await apiClient.post('/api/v1/auth/activate', payload, { signal });
    return parseOrThrow(tokenResponseSchema, data, 'authService.activateAccount');
  },
};
