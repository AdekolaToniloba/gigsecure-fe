import { describe, expect, it } from 'vitest';
import {
  activateAccountFormSchema,
  backendTokenResponseSchema,
  browserTokenResponseSchema,
  changePasswordFormSchema,
  registerFormSchema,
  registerResponseSchema,
  resetPasswordFormSchema,
  verifyEmailRequestSchema,
} from '@/lib/validators/auth';

describe('auth validator response schemas', () => {
  it('parses backend token responses with refresh_token', () => {
    const result = backendTokenResponseSchema.parse({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      kyc_verified: false,
      risk_assessed: true,
    });

    expect(result).toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      token_type: 'bearer',
      kyc_verified: false,
      risk_assessed: true,
    });
  });

  it('rejects backend token responses without refresh_token', () => {
    expect(() =>
      backendTokenResponseSchema.parse({
        access_token: 'access-token',
        token_type: 'bearer',
      })
    ).toThrow();
  });

  it('parses browser-safe BFF token responses without refresh_token', () => {
    const result = browserTokenResponseSchema.parse({
      access_token: 'access-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: false,
    });

    expect(result).toEqual({
      access_token: 'access-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: false,
    });
    expect('refresh_token' in result).toBe(false);
  });

  it('defaults missing token flags to false for backend rollout tolerance', () => {
    const result = browserTokenResponseSchema.parse({
      access_token: 'access-token',
      token_type: 'bearer',
    });

    expect(result.kyc_verified).toBe(false);
    expect(result.risk_assessed).toBe(false);
  });

  it('parses register responses as message-only', () => {
    expect(
      registerResponseSchema.parse({
        message: 'Registration successful. Please check your email.',
      })
    ).toEqual({
      message: 'Registration successful. Please check your email.',
    });
  });
});

describe('auth password form schemas', () => {
  it('strips confirm_password from register form output', () => {
    const result = registerFormSchema.parse({
      email: 'user@example.com',
      password: 'SecurePass123',
      confirm_password: 'SecurePass123',
      first_name: 'Amaka',
      last_name: 'Obi',
    });

    expect(result).toEqual({
      email: 'user@example.com',
      password: 'SecurePass123',
      first_name: 'Amaka',
      last_name: 'Obi',
    });
    expect('confirm_password' in result).toBe(false);
  });

  it('rejects register form output when passwords do not match', () => {
    const result = registerFormSchema.safeParse({
      email: 'user@example.com',
      password: 'SecurePass123',
      confirm_password: 'Different123',
      first_name: 'Amaka',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirm_password']);
    }
  });

  it('strips confirm_password from reset password form output', () => {
    const result = resetPasswordFormSchema.parse({
      token: 'reset-token',
      new_password: 'NewPass123',
      confirm_password: 'NewPass123',
    });

    expect(result).toEqual({
      token: 'reset-token',
      new_password: 'NewPass123',
    });
  });

  it('strips confirm_password from activate account form output', () => {
    const result = activateAccountFormSchema.parse({
      token: 'activate-token',
      password: 'SecurePass123',
      confirm_password: 'SecurePass123',
    });

    expect(result).toEqual({
      token: 'activate-token',
      password: 'SecurePass123',
    });
  });

  it('strips confirm_password from change password form output', () => {
    const result = changePasswordFormSchema.parse({
      old_password: 'OldPass123',
      new_password: 'NewPass123',
      confirm_password: 'NewPass123',
    });

    expect(result).toEqual({
      old_password: 'OldPass123',
      new_password: 'NewPass123',
    });
  });
});

describe('auth token-required schemas', () => {
  it('rejects missing verification tokens', () => {
    expect(() => verifyEmailRequestSchema.parse({ token: '' })).toThrow();
  });

  it('rejects missing reset password tokens', () => {
    expect(() =>
      resetPasswordFormSchema.parse({
        token: '',
        new_password: 'NewPass123',
        confirm_password: 'NewPass123',
      })
    ).toThrow();
  });

  it('rejects missing activate account tokens', () => {
    expect(() =>
      activateAccountFormSchema.parse({
        token: '',
        password: 'SecurePass123',
        confirm_password: 'SecurePass123',
      })
    ).toThrow();
  });
});
