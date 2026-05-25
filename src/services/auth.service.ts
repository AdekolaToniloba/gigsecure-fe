import { AUTH_ENDPOINTS } from '@/lib/api/endpoints';
import {
  messageResponseSchema,
  registerResponseSchema,
  tokenResponseSchema,
  waitlistSignupResponseSchema,
} from '@/lib/validators/auth';
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

async function fetchAuth<T>(
  endpoint: string,
  {
    method = 'POST',
    payload,
    signal,
    schema,
    context,
    authorization,
  }: {
    method?: 'POST' | 'PUT';
    payload?: unknown;
    signal?: AbortSignal;
    schema: { parse: (data: unknown) => T };
    context: string;
    authorization?: string | null;
  }
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (authorization) {
    headers.Authorization = `Bearer ${authorization}`;
  }

  const res = await fetch(endpoint, {
    method,
    headers,
    body: payload === undefined ? undefined : JSON.stringify(payload),
    signal,
  });
  const data = await safeJson(res);
  if (!res.ok) throw data;
  return parseOrThrow(schema, data, context);
}

/** All auth calls go through BFF routes — never directly to the backend */
export const authService = {
  async login(payload: LoginRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.LOGIN, {
      payload,
      signal,
      schema: tokenResponseSchema,
      context: 'authService.login',
    });
  },

  async register(payload: RegisterRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.REGISTER, {
      payload,
      signal,
      schema: registerResponseSchema,
      context: 'authService.register',
    });
  },

  async waitlistSignup(payload: WaitlistSignupRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.WAITLIST, {
      payload,
      signal,
      schema: waitlistSignupResponseSchema,
      context: 'authService.waitlistSignup',
    });
  },

  async logout(signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.LOGOUT, {
      signal,
      schema: messageResponseSchema,
      context: 'authService.logout',
    });
  },

  async refresh(signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.REFRESH, {
      signal,
      schema: tokenResponseSchema,
      context: 'authService.refresh',
    });
  },

  async forgotPassword(payload: ForgotPasswordRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
      payload,
      signal,
      schema: messageResponseSchema,
      context: 'authService.forgotPassword',
    });
  },

  async resetPassword(payload: ResetPasswordRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.RESET_PASSWORD, {
      payload,
      signal,
      schema: messageResponseSchema,
      context: 'authService.resetPassword',
    });
  },

  async changePassword(payload: ChangePasswordRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      method: 'PUT',
      payload,
      signal,
      schema: messageResponseSchema,
      context: 'authService.changePassword',
      authorization: useAuthStore.getState().accessToken,
    });
  },

  async verifyEmail(payload: VerifyEmailRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.VERIFY_EMAIL, {
      payload,
      signal,
      schema: tokenResponseSchema,
      context: 'authService.verifyEmail',
    });
  },

  async activateAccount(payload: ActivateAccountRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.ACTIVATE, {
      payload,
      signal,
      schema: tokenResponseSchema,
      context: 'authService.activateAccount',
    });
  },

  async resendActivation(payload: ResendActivationRequest, signal?: AbortSignal) {
    return fetchAuth(AUTH_ENDPOINTS.RESEND_ACTIVATION, {
      payload,
      signal,
      schema: messageResponseSchema,
      context: 'authService.resendActivation',
    });
  },
};
