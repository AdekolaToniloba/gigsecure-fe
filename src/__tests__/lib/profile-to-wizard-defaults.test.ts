import { describe, expect, it } from 'vitest';
import { profileToWizardDefaults } from '@/lib/risk/profile-to-wizard-defaults';
import type { UserWithProfileResponse } from '@/lib/validators/user';

const profileResponse: UserWithProfileResponse = {
  user: {
    id: '00000000-0000-4000-8000-000000000001',
    email: 'profile@example.com',
    first_name: 'Profile',
    last_name: 'Person',
    status: 'active',
    role: 'user',
    email_verified: true,
  },
  profile: {
    date_of_birth: '1992-04-09',
    gender: 'FEMALE',
    state: 'Lagos',
    city: 'Ikeja',
    occupation: 'tech_freelancer',
  },
  kyc_verified: true,
  risk_assessed: false,
};

describe('profileToWizardDefaults', () => {
  it('maps only supported dashboard profile fields', () => {
    expect(profileToWizardDefaults({
      mode: 'dashboard',
      profileResponse,
    })).toEqual({
      first_name: 'Profile',
      last_name: 'Person',
      date_of_birth: '09/04/1992',
      gender: 'female',
      state: 'Lagos',
      city: 'Ikeja',
      occupation: 'tech_freelancer',
      marital_status: '',
    });
  });

  it('gives resumed dashboard answers precedence over profile values', () => {
    const defaults = profileToWizardDefaults({
      mode: 'dashboard',
      profileResponse,
      resumedAnswers: {
        first_name: 'Resumed',
        city: 'Epe',
        marital_status: 'Single',
      },
    });

    expect(defaults.first_name).toBe('Resumed');
    expect(defaults.city).toBe('Epe');
    expect(defaults.marital_status).toBe('Single');
    expect(defaults.state).toBe('Lagos');
  });

  it('uses only resumed answers and waitlist name metadata in public mode', () => {
    const defaults = profileToWizardDefaults({
      mode: 'public',
      profileResponse,
      waitlistUser: { firstName: 'Waitlist', lastName: 'User' },
      resumedAnswers: { first_name: 'Resumed', state: 'Abuja' },
    });

    expect(defaults).toEqual({
      first_name: 'Resumed',
      last_name: 'User',
      date_of_birth: '',
      gender: '',
      state: 'Abuja',
      city: '',
      occupation: '',
      marital_status: '',
    });
    expect(defaults).not.toHaveProperty('email');
  });

  it('degrades invalid or partial profile values to editable empty defaults', () => {
    const defaults = profileToWizardDefaults({
      mode: 'dashboard',
      profileResponse: {
        ...profileResponse,
        user: { ...profileResponse.user, last_name: null },
        profile: { date_of_birth: 'not-a-date', city: null },
      },
    });

    expect(defaults.last_name).toBe('');
    expect(defaults.date_of_birth).toBe('');
    expect(defaults.city).toBe('');
    expect(defaults.marital_status).toBe('');
  });
});
