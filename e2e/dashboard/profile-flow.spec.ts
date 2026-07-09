import { expect, test, type Page } from '@playwright/test';
import { assessedDashboardOverview } from '../../src/mocks/fixtures/dashboard';
import type { ProfileResponse } from '../../src/types/profile';
import {
  DASHBOARD_ACCESS_TOKEN,
  dashboardAssessmentResponse,
  expectNoHorizontalOverflow,
  fulfillJson,
  mockAnonymousRefresh,
  mockRefresh,
  seedRefreshCookie,
} from '../risk-assessment/helpers';

type ProfileWithRecord = ProfileResponse & {
  profile: NonNullable<ProfileResponse['profile']>;
};

test('unauthenticated direct entry to /dashboard/profile redirects to login', async ({ page }) => {
  await mockAnonymousRefresh(page);

  await page.goto('/dashboard/profile');

  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Fprofile$/);
  await expect(page.getByRole('heading', { name: 'Profile' })).toHaveCount(0);
});

test('authenticated users can open Profile from the sidebar and complete the core profile flows', async ({
  page,
  context,
}) => {
  await seedRefreshCookie(context);
  await mockRefresh(page, { kycVerified: true, riskAssessed: true });

  const api = await mockProfileRoutes(page);

  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Profile' }).click();

  await expect(page).toHaveURL('/dashboard/profile');
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expect(page.getByText('Amaka Obi')).toBeVisible();
  await expect(page.getByText('Manage your personal details, security and preferences')).toBeVisible();

  await page.getByRole('button', { name: 'Edit Work profile' }).click();
  const incomeInput = page.getByLabel('Average monthly income');
  await incomeInput.fill('180000');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByText('Changes saved successfully.')).toBeVisible();
  await expect(page.getByText('180,000')).toBeVisible();
  expect(api.profileUpdatePayloads()).toEqual([{ average_monthly_income: '180000' }]);

  await page.getByRole('tab', { name: 'Risk Data' }).click();
  await expect(page.getByRole('heading', { name: 'Personal details' })).toBeVisible();
  await expect(page.getByText('Income updated')).toBeVisible();
  await expect(
    page.getByText('Not available from the current assessment summary.').first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Update assessment' }).first()).toHaveAttribute(
    'href',
    '/dashboard/risk-assessment',
  );

  await page.getByRole('tab', { name: 'Security' }).click();
  await expect(page.getByText('Identity verification')).toBeVisible();
  await expect(page.getByText('Verified')).toBeVisible();

  await page.getByRole('button', { name: 'Change' }).click();
  await page.getByLabel(/Current password/i).fill('WrongPass123');
  await page.getByLabel(/New password/i).fill('NewPass123');
  await page.getByLabel(/Confirm password/i).fill('NewPass123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByRole('alert')).toContainText('Current password is incorrect.');

  await page.getByLabel(/Current password/i).fill('OldPass123');
  await page.getByRole('button', { name: 'Update password' }).click();
  await expect(page.getByText('Your password was updated successfully.')).toBeVisible();
  await expect(page).toHaveURL('/dashboard/profile');
  expect(api.passwordAttempts()).toBe(2);
});

test('the protected profile route stays free of horizontal overflow on mobile and desktop', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seedRefreshCookie(context);
  await mockRefresh(page, { kycVerified: true, riskAssessed: true });
  await mockProfileRoutes(page);

  await page.goto('/dashboard/profile');
  await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  await expectNoHorizontalOverflow(page, [320, 390, 768, 1024, 1280, 1440]);
});

async function mockProfileRoutes(page: Page) {
  let currentProfile = buildProfileResponse();
  let passwordAttemptCount = 0;
  const updatePayloads: Array<Record<string, unknown>> = [];

  await page.route('**/api/v1/users/me', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);

    if (route.request().method() === 'PUT') {
      const payload = route.request().postDataJSON() as Record<string, unknown>;
      updatePayloads.push(payload);
      currentProfile = mergeProfileUpdate(currentProfile, payload);
      await fulfillJson(route, currentProfile);
      return;
    }

    await fulfillJson(route, currentProfile);
  });

  await page.route('**/api/v1/dashboard/overview', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    await fulfillJson(route, assessedDashboardOverview);
  });

  await page.route('**/api/v1/risk/assessment', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    await fulfillJson(route, dashboardAssessmentResponse);
  });

  await page.route('**/api/v1/kyc/status', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    await fulfillJson(route, {
      status: 'verified',
      document_type: 'NIN',
      verified_at: '2026-04-24T10:00:00Z',
      rejection_reason: null,
    });
  });

  await page.route('**/api/auth/change-password', async (route) => {
    passwordAttemptCount += 1;
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    const body = route.request().postDataJSON() as Record<string, unknown>;
    expect(body).not.toHaveProperty('confirm_password');

    if (passwordAttemptCount === 1) {
      await fulfillJson(route, { detail: 'Current password is incorrect.' }, 400);
      return;
    }

    await fulfillJson(route, { message: 'Password changed successfully' });
  });

  return {
    passwordAttempts: () => passwordAttemptCount,
    profileUpdatePayloads: () => updatePayloads,
  };
}

function buildProfileResponse(): ProfileWithRecord {
  return {
    user: {
      id: '00000000-0000-4000-8000-000000000099',
      email: 'amaka@example.com',
      first_name: 'Amaka',
      last_name: 'Obi',
      status: 'active',
      role: 'user',
      email_verified: true,
      phone_number: '+2348012345678',
      last_login_at: '2026-07-08T08:00:00Z',
      created_at: '2026-01-10T09:00:00Z',
    },
    profile: {
      date_of_birth: '1994-04-12',
      gender: 'female',
      address_line_1: '12 Admiralty Way',
      address_line_2: 'Lekki Phase 1',
      city: 'Ikeja',
      state: 'Lagos',
      country: 'Nigeria',
      postal_code: '106104',
      occupation: 'tech_freelancer',
      gig_platform: 'Upwork',
      average_monthly_income: '150000',
      years_of_experience: 5,
      profile_picture_url: null,
    },
    kyc_verified: true,
    risk_assessed: true,
  };
}

function mergeProfileUpdate(
  currentProfile: ProfileWithRecord,
  payload: Record<string, unknown>,
): ProfileWithRecord {
  return {
    ...currentProfile,
    user: {
      ...currentProfile.user,
      first_name:
        typeof payload.first_name === 'string' ? payload.first_name : currentProfile.user.first_name,
      last_name:
        typeof payload.last_name === 'string' || payload.last_name === null
          ? payload.last_name
          : currentProfile.user.last_name,
      phone_number:
        typeof payload.phone_number === 'string' || payload.phone_number === null
          ? payload.phone_number
          : currentProfile.user.phone_number,
    },
    profile: {
      ...currentProfile.profile,
      ...payload,
      average_monthly_income:
        payload.average_monthly_income === undefined
          ? currentProfile.profile.average_monthly_income
          : payload.average_monthly_income === null
            ? null
            : String(payload.average_monthly_income),
      years_of_experience:
        payload.years_of_experience === undefined
          ? currentProfile.profile.years_of_experience
          : payload.years_of_experience === null
            ? null
            : Number(payload.years_of_experience),
    },
  };
}
