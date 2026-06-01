import type { z } from 'zod';
import type {
  activateAccountFormSchema,
  activateAccountRequestSchema,
  backendTokenResponseSchema,
  browserTokenResponseSchema,
  changePasswordFormSchema,
  changePasswordRequestSchema,
  forgotPasswordRequestSchema,
  loginRequestSchema,
  messageResponseSchema,
  registerFormSchema,
  registerRequestSchema,
  registerResponseSchema,
  resetPasswordFormSchema,
  resetPasswordRequestSchema,
  resendActivationRequestSchema,
  verifyEmailRequestSchema,
  waitlistSignupRequestSchema,
  waitlistSignupResponseSchema,
  tokenResponseSchema,
} from '@/lib/validators/auth';

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type WaitlistSignupRequest = z.infer<typeof waitlistSignupRequestSchema>;
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
export type ResendActivationRequest = z.infer<typeof resendActivationRequestSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
export type ChangePasswordRequest = z.infer<typeof changePasswordRequestSchema>;
export type VerifyEmailRequest = z.infer<typeof verifyEmailRequestSchema>;
export type ActivateAccountRequest = z.infer<typeof activateAccountRequestSchema>;

export type RegisterFormInput = z.input<typeof registerFormSchema>;
export type RegisterFormOutput = z.output<typeof registerFormSchema>;
export type ResetPasswordFormInput = z.input<typeof resetPasswordFormSchema>;
export type ResetPasswordFormOutput = z.output<typeof resetPasswordFormSchema>;
export type ActivateAccountFormInput = z.input<typeof activateAccountFormSchema>;
export type ActivateAccountFormOutput = z.output<typeof activateAccountFormSchema>;
export type ChangePasswordFormInput = z.input<typeof changePasswordFormSchema>;
export type ChangePasswordFormOutput = z.output<typeof changePasswordFormSchema>;

export type BrowserTokenResponse = z.infer<typeof browserTokenResponseSchema>;
export type BackendTokenResponse = z.infer<typeof backendTokenResponseSchema>;
export type TokenResponse = z.infer<typeof tokenResponseSchema>;
export type RegisterResponse = z.infer<typeof registerResponseSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type WaitlistSignupResponse = z.infer<typeof waitlistSignupResponseSchema>;
