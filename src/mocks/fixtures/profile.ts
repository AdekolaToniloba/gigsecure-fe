import type { ProfileResponse } from '@/types/profile';

export const profileUserFixture: ProfileResponse['user'] = {
  id: '00000000-0000-4000-8000-000000000000',
  email: 'test@gigsecure.com',
  first_name: 'Test',
  last_name: 'User',
  status: 'active',
  role: 'user',
  email_verified: true,
  phone_number: null,
  last_login_at: null,
  created_at: '2026-07-08T10:00:00.000Z',
};

export const emptyProfileResponseFixture: ProfileResponse = {
  user: profileUserFixture,
  profile: null,
  kyc_verified: false,
  risk_assessed: true,
};

export const fullProfileResponseFixture: ProfileResponse = {
  user: {
    ...profileUserFixture,
    phone_number: '+2348012345678',
  },
  profile: {
    date_of_birth: '1994-04-12',
    gender: 'Female',
    address_line_1: '12 Admiralty Way',
    address_line_2: 'Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria',
    postal_code: '106104',
    occupation: 'tech_freelancer',
    gig_platform: 'Upwork',
    average_monthly_income: '150000',
    years_of_experience: 5,
    profile_picture_url: 'https://images.example.com/avatar.png',
  },
  kyc_verified: true,
  risk_assessed: true,
};

export function buildUpdatedProfileResponse(
  payload: Record<string, unknown>,
  base: ProfileResponse = fullProfileResponseFixture,
): ProfileResponse {
  return {
    ...base,
    user: {
      ...base.user,
      first_name: typeof payload.first_name === 'string' ? payload.first_name : base.user.first_name,
      last_name: typeof payload.last_name === 'string' || payload.last_name === null
        ? payload.last_name
        : base.user.last_name,
      phone_number: typeof payload.phone_number === 'string' || payload.phone_number === null
        ? payload.phone_number
        : base.user.phone_number,
    },
    profile: {
      ...(base.profile ?? {}),
      ...payload,
      average_monthly_income:
        payload.average_monthly_income === undefined
          ? base.profile?.average_monthly_income ?? null
          : payload.average_monthly_income === null
            ? null
            : String(payload.average_monthly_income),
      years_of_experience:
        payload.years_of_experience === undefined
          ? base.profile?.years_of_experience ?? null
          : typeof payload.years_of_experience === 'number'
            ? payload.years_of_experience
            : payload.years_of_experience === null
              ? null
              : Number(payload.years_of_experience),
    },
  };
}

export const profileValidationErrorFixture = {
  detail: [
    {
      loc: ['body', 'average_monthly_income'],
      msg: 'Enter a valid amount.',
      type: 'value_error.decimal',
    },
  ],
};
