import { z } from 'zod';

// ─── User Profile ──────────────────────────────────────────────────
export const userProfileResponseSchema = z.object({
  date_of_birth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  gig_platform: z.string().nullable().optional(),
  average_monthly_income: z.coerce.number().nullable().optional(),
  years_of_experience: z.number().int().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
});

export const userResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone_number: z.string().nullable().optional(),
  first_name: z.string(),
  last_name: z.string().nullable().optional(),
  status: z.string(),
  email_verified: z.boolean(),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const userWithProfileResponseSchema = z.object({
  user: userResponseSchema,
  profile: userProfileResponseSchema.nullable().optional(),
});

// ─── Update Profile Request ────────────────────────────────────────
export const updateProfileRequestSchema = z.object({
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  address_line_1: z.string().nullable().optional(),
  address_line_2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  gig_platform: z.string().nullable().optional(),
  average_monthly_income: z.coerce.number().nullable().optional(),
  years_of_experience: z.number().int().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type UserWithProfileResponse = z.infer<typeof userWithProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
