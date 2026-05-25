import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

const requiredString = (message: string) => z.string().trim().min(1, message);

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

const confirmPasswordSchema = z
  .string()
  .min(1, 'Please confirm your password')
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`);

// ─── Requests ──────────────────────────────────────────────────────
export const loginRequestSchema = z.object({
  email: z.string().trim().email(),
  password: requiredString('Password is required'),
});

export const registerRequestSchema = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
  first_name: requiredString('First name is required'),
  last_name: z.string().nullable().optional(),
});

export const waitlistSignupRequestSchema = z.object({
  email: z.string().trim().email('Invalid email format'),
  first_name: requiredString('First name is required'),
  last_name: z.string().nullable().optional(),
});

export const forgotPasswordRequestSchema = z.object({
  email: z.string().trim().email(),
});

export const resendActivationRequestSchema = forgotPasswordRequestSchema;

export const resetPasswordRequestSchema = z.object({
  token: requiredString('Reset token is required'),
  new_password: passwordSchema,
});

export const changePasswordRequestSchema = z.object({
  old_password: requiredString('Current password is required'),
  new_password: passwordSchema,
});

export const verifyEmailRequestSchema = z.object({
  token: requiredString('Verification token is required'),
});

export const activateAccountRequestSchema = z.object({
  token: requiredString('Activation token is required'),
  password: passwordSchema,
});

// ─── UI Form Schemas ───────────────────────────────────────────────
export const registerFormSchema = registerRequestSchema
  .extend({
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .transform((data) => ({
    email: data.email,
    password: data.password,
    first_name: data.first_name,
    last_name: data.last_name,
  }));

export const resetPasswordFormSchema = resetPasswordRequestSchema
  .extend({
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .transform((data) => ({
    token: data.token,
    new_password: data.new_password,
  }));

export const activateAccountFormSchema = activateAccountRequestSchema
  .extend({
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .transform((data) => ({
    token: data.token,
    password: data.password,
  }));

export const changePasswordFormSchema = changePasswordRequestSchema
  .extend({
    confirm_password: confirmPasswordSchema,
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })
  .transform((data) => ({
    old_password: data.old_password,
    new_password: data.new_password,
  }));

// ─── Responses ─────────────────────────────────────────────────────
export const browserTokenResponseSchema = z.object({
  access_token: requiredString('Access token is required'),
  token_type: z.string().default('bearer'),
});

export const backendTokenResponseSchema = browserTokenResponseSchema.extend({
  refresh_token: requiredString('Refresh token is required'),
});

// Browser-safe token response returned by the BFF. It intentionally excludes
// refresh_token because that value must stay in an httpOnly cookie.
export const tokenResponseSchema = browserTokenResponseSchema;

export const registerResponseSchema = z.object({
  message: requiredString('Message is required'),
});

export const messageResponseSchema = z.object({
  message: requiredString('Message is required'),
});

export const waitlistSignupResponseSchema = z.object({
  message: requiredString('Message is required'),
  user_id: z.string().optional(),
  access_token: requiredString('Access token is required'),
  token_type: z.string().default('bearer'),
});

// ─── Inferred Types ────────────────────────────────────────────────
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
