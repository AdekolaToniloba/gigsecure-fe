import { z } from 'zod';

// ─── Requests ──────────────────────────────────────────────────────
export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().nullable().optional(),
});

export const waitlistSignupRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().nullable().optional(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  new_password: z.string().min(8),
});

export const changePasswordRequestSchema = z.object({
  old_password: z.string().min(1),
  new_password: z.string().min(8),
});

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export const activateAccountRequestSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

// ─── Responses ─────────────────────────────────────────────────────
export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.string().default('bearer'),
});

export const waitlistSignupResponseSchema = z.object({
  message: z.string(),
  user_id: z.string().optional(),
  access_token: z.string(),
  token_type: z.string().default('bearer'),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type WaitlistSignupRequest = z.infer<typeof waitlistSignupRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ActivateAccountRequest = z.infer<typeof activateAccountRequestSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type WaitlistSignupResponse = z.infer<typeof waitlistSignupResponseSchema>;
