import { describe, expect, it } from 'vitest';
import {
  buildDirtyProfilePayload,
  createProfileFormValues,
  profileFormSchema,
} from '@/lib/validators/user';
import { fullProfileResponseFixture } from '@/mocks/fixtures/profile';

describe('profile validators', () => {
  it('creates string-based form values from a user/profile response', () => {
    expect(createProfileFormValues(fullProfileResponseFixture)).toMatchObject({
      first_name: 'Test',
      last_name: 'User',
      city: 'Lagos',
      average_monthly_income: '150000',
      years_of_experience: '5',
    });
  });

  it('parses valid editable form input and preserves decimal-string boundaries', () => {
    const result = profileFormSchema.parse({
      first_name: ' Test ',
      last_name: '',
      phone_number: '',
      date_of_birth: '1994-04-12',
      gender: 'Female',
      address_line_1: '',
      address_line_2: '',
      city: 'Lagos',
      state: 'Lagos',
      country: 'Nigeria',
      postal_code: '',
      occupation: 'tech_freelancer',
      gig_platform: 'Upwork',
      average_monthly_income: '150000.50',
      years_of_experience: '7',
      profile_picture_url: '',
    });

    expect(result.first_name).toBe('Test');
    expect(result.last_name).toBeNull();
    expect(result.average_monthly_income).toBe('150000.50');
    expect(result.years_of_experience).toBe(7);
    expect(result.profile_picture_url).toBeNull();
  });

  it('rejects invalid income, invalid dates, and non-integer experience', () => {
    const result = profileFormSchema.safeParse({
      ...createProfileFormValues(fullProfileResponseFixture),
      date_of_birth: '12/04/1994',
      average_monthly_income: 'abc',
      years_of_experience: '4.5',
    });

    expect(result.success).toBe(false);
  });

  it('builds a dirty payload with only changed documented fields', () => {
    const parsed = profileFormSchema.parse({
      ...createProfileFormValues(fullProfileResponseFixture),
      first_name: 'Ada',
      city: 'Abuja',
      years_of_experience: '8',
    });

    expect(
      buildDirtyProfilePayload(parsed, fullProfileResponseFixture),
    ).toEqual({
      first_name: 'Ada',
      city: 'Abuja',
      years_of_experience: 8,
    });
  });

  it('supports null payload values when a user clears fields', () => {
    const parsed = profileFormSchema.parse({
      ...createProfileFormValues(fullProfileResponseFixture),
      address_line_2: '',
      average_monthly_income: '',
    });

    expect(
      buildDirtyProfilePayload(parsed, fullProfileResponseFixture, [
        'address_line_2',
        'average_monthly_income',
      ]),
    ).toEqual({
      address_line_2: null,
      average_monthly_income: null,
    });
  });
});
