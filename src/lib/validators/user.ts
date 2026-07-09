import { z } from 'zod';
import type { ProfileResponse as GeneratedUserWithProfileResponse } from '@/types/profile';

export const decimalStringSchema = z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/);

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date.');
const integerStringSchema = z.string().regex(/^-?\d+$/, 'Enter a whole number.');
function toNullableString(value: string | null | undefined) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableInteger(value: string | number | null | undefined) {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && integerStringSchema.safeParse(value.trim()).success) {
    return Number(value.trim());
  }
  return null;
}

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
  average_monthly_income: decimalStringSchema.nullable().optional(),
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
  role: z.string(),
  email_verified: z.boolean(),
  last_login_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
});

export const userWithProfileResponseSchema = z.object({
  user: userResponseSchema,
  profile: userProfileResponseSchema.nullable().optional(),
  kyc_verified: z.boolean().default(false),
  risk_assessed: z.boolean().default(false),
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
  average_monthly_income: z.union([z.number(), decimalStringSchema]).nullable().optional(),
  years_of_experience: z.number().int().nullable().optional(),
  profile_picture_url: z.string().nullable().optional(),
});

export const profileFormSchema = z.object({
  first_name: z.string().trim(),
  last_name: z.string().trim(),
  phone_number: z.string().trim(),
  date_of_birth: z.string().trim().refine(
    (value) => value.length === 0 || isoDateSchema.safeParse(value).success,
    'Enter a valid date.',
  ),
  gender: z.string().trim(),
  address_line_1: z.string().trim(),
  address_line_2: z.string().trim(),
  city: z.string().trim(),
  state: z.string().trim(),
  country: z.string().trim(),
  postal_code: z.string().trim(),
  occupation: z.string().trim(),
  gig_platform: z.string().trim(),
  average_monthly_income: z.string().trim().refine(
    (value) => value.length === 0 || decimalStringSchema.safeParse(value).success,
    'Enter a valid amount.',
  ),
  years_of_experience: z.string().trim().refine(
    (value) => value.length === 0 || integerStringSchema.safeParse(value).success,
    'Enter a whole number.',
  ),
  profile_picture_url: z.string().trim(),
}).transform((values) => ({
  first_name: toNullableString(values.first_name),
  last_name: toNullableString(values.last_name),
  phone_number: toNullableString(values.phone_number),
  date_of_birth: toNullableString(values.date_of_birth),
  gender: toNullableString(values.gender),
  address_line_1: toNullableString(values.address_line_1),
  address_line_2: toNullableString(values.address_line_2),
  city: toNullableString(values.city),
  state: toNullableString(values.state),
  country: toNullableString(values.country),
  postal_code: toNullableString(values.postal_code),
  occupation: toNullableString(values.occupation),
  gig_platform: toNullableString(values.gig_platform),
  average_monthly_income: toNullableString(values.average_monthly_income),
  years_of_experience: toNullableInteger(values.years_of_experience),
  profile_picture_url: toNullableString(values.profile_picture_url),
}));

export function createProfileFormValues(response: GeneratedUserWithProfileResponse) {
  return {
    first_name: response.user.first_name ?? '',
    last_name: response.user.last_name ?? '',
    phone_number: response.user.phone_number ?? '',
    date_of_birth: response.profile?.date_of_birth ?? '',
    gender: response.profile?.gender ?? '',
    address_line_1: response.profile?.address_line_1 ?? '',
    address_line_2: response.profile?.address_line_2 ?? '',
    city: response.profile?.city ?? '',
    state: response.profile?.state ?? '',
    country: response.profile?.country ?? '',
    postal_code: response.profile?.postal_code ?? '',
    occupation: response.profile?.occupation ?? '',
    gig_platform: response.profile?.gig_platform ?? '',
    average_monthly_income: response.profile?.average_monthly_income ?? '',
    years_of_experience:
      response.profile?.years_of_experience === null
      || response.profile?.years_of_experience === undefined
        ? ''
        : String(response.profile.years_of_experience),
    profile_picture_url: response.profile?.profile_picture_url ?? '',
  };
}

export function buildDirtyProfilePayload(
  values: ProfileFormOutput,
  response: GeneratedUserWithProfileResponse,
  fields?: readonly ProfileEditableField[],
): UpdateProfileRequest {
  const baseline = profileFormSchema.parse(createProfileFormValues(response));
  const allowedFields = fields ?? PROFILE_EDITABLE_FIELDS;

  return allowedFields.reduce<UpdateProfileRequest>((payload, field) => {
    if (values[field] !== baseline[field]) {
      (payload as Record<ProfileEditableField, ProfileFormOutput[ProfileEditableField] | undefined>)[field] = values[field];
    }
    return payload;
  }, {});
}

// ─── Inferred Types ────────────────────────────────────────────────
export type UserResponse = z.infer<typeof userResponseSchema>;
export type UserProfileResponse = z.infer<typeof userProfileResponseSchema>;
export type UserWithProfileResponse = z.infer<typeof userWithProfileResponseSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;
export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;

export const PROFILE_EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'phone_number',
  'date_of_birth',
  'gender',
  'address_line_1',
  'address_line_2',
  'city',
  'state',
  'country',
  'postal_code',
  'occupation',
  'gig_platform',
  'average_monthly_income',
  'years_of_experience',
  'profile_picture_url',
] as const;

export type ProfileEditableField = (typeof PROFILE_EDITABLE_FIELDS)[number];
