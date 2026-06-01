import { describe, expect, it } from 'vitest';
import { userWithProfileResponseSchema } from '@/lib/validators/user';

const user = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'amaka@example.com',
  first_name: 'Amaka',
  last_name: 'Obi',
  status: 'active',
  email_verified: true,
};

describe('user validators', () => {
  it('parses user profile responses with flags', () => {
    const result = userWithProfileResponseSchema.parse({
      user,
      profile: {
        date_of_birth: '1995-06-15',
        city: 'Lagos',
        average_monthly_income: '150000',
      },
      kyc_verified: true,
      risk_assessed: false,
    });

    expect(result.kyc_verified).toBe(true);
    expect(result.risk_assessed).toBe(false);
    expect(result.profile?.average_monthly_income).toBe(150000);
  });

  it('parses null profiles and defaults missing flags to false', () => {
    const result = userWithProfileResponseSchema.parse({
      user,
      profile: null,
    });

    expect(result.profile).toBeNull();
    expect(result.kyc_verified).toBe(false);
    expect(result.risk_assessed).toBe(false);
  });

  it('parses responses without a profile object', () => {
    const result = userWithProfileResponseSchema.parse({ user });

    expect(result.profile).toBeUndefined();
    expect(result.kyc_verified).toBe(false);
    expect(result.risk_assessed).toBe(false);
  });
});
