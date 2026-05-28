import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { userService } from '@/services/user.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const user = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'amaka@example.com',
  first_name: 'Amaka',
  last_name: 'Obi',
  status: 'active',
  email_verified: true,
};

describe('userService', () => {
  it('gets the current user profile with flags through apiClient', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      kycVerified: false,
      riskAssessed: false,
    });

    const result = await userService.getMe();

    expect(result.user.email).toBe('test@gigsecure.com');
    expect(result.profile).toBeNull();
    expect(result.kyc_verified).toBe(false);
    expect(result.risk_assessed).toBe(true);
  });

  it('parses updated profile responses and flags', async () => {
    useAuthStore.getState().setSession({
      accessToken: 'access-token',
      kycVerified: false,
      riskAssessed: false,
    });

    const result = await userService.updateProfile({
      city: 'Lagos',
      average_monthly_income: 150000,
    });

    expect(result.profile?.city).toBe('Lagos');
    expect(result.kyc_verified).toBe(false);
    expect(result.risk_assessed).toBe(true);
  });

  it('rejects invalid profile response shapes', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/users/me`, () =>
        HttpResponse.json({ user: { ...user, id: 'not-a-uuid' }, profile: null })
      )
    );

    await expect(userService.getMe()).rejects.toThrow(
      'Invalid API response shape in userService.getMe'
    );
  });
});
