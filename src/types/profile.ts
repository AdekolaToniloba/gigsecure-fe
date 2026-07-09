import type { components } from './schema';

export type ProfileResponse = components['schemas']['UserWithProfileResponse'];
export type ProfileUser = components['schemas']['UserResponse'];
export type ProfileRecord = components['schemas']['UserProfileResponse'];
export type ProfileUpdateRequest = components['schemas']['UpdateProfileRequest'];
export type ProfileKycStatus = components['schemas']['KYCStatusResponse'];
export type ProfileAssessment = components['schemas']['AssessmentResponse'];
export type ProfileAssessmentSummary = components['schemas']['AssessmentSummary'];

export const PROFILE_TAB_IDS = [
  'personal-information',
  'risk-data',
  'security',
] as const;

export type ProfileTabId = (typeof PROFILE_TAB_IDS)[number];

export const ASSESSMENT_RELEVANT_PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'city',
  'state',
  'country',
  'occupation',
  'gig_platform',
  'average_monthly_income',
  'years_of_experience',
] as const;

export type AssessmentRelevantProfileField =
  (typeof ASSESSMENT_RELEVANT_PROFILE_FIELDS)[number];
