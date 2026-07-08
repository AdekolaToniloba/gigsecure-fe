import { expect, test, type Page, type Route } from '@playwright/test';

const E2E_BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/refresh', async (route) => {
    await fulfillJson(route, { detail: 'No refresh token' }, 401);
  });
});

test('unauthenticated users are redirected away from /kyc', async ({ page }) => {
  await page.goto('/kyc');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fkyc$/);
});

test('verified users see verified KYC state and profile details on /kyc', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: true,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'verified');
  await loginAs(page, { kycVerified: true, riskAssessed: true }, '/kyc');

  await expect(page.getByText('KYC successfully verified')).toBeVisible();
  await expect(page.getByText(/^Verified$/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'User information' })).toBeVisible();
  await expect(page.getByText('Amaka Obi')).toBeVisible();
  await expect(page.getByText('amaka@example.com')).toBeVisible();
});

test('successful NIN verification works end-to-end', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: false,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'null');

  let verifyPayload: unknown = null;
  await page.route('**/api/v1/kyc/verify', async (route) => {
    verifyPayload = route.request().postDataJSON();
    await fulfillJson(route, {
      status: 'verified',
      message: 'Identity verified successfully.',
      smile_job_id: '500000001',
    });
  });
  await loginAs(page, { kycVerified: false, riskAssessed: true }, '/kyc');

  await expect(page.getByText(/^NIN$/)).toBeVisible();
  await expect(page.getByText(/BVN/i)).toHaveCount(0);
  await page.getByLabel('Document number').fill('12345678901');
  await page.getByLabel('First name').fill('Amaka');
  await page.getByLabel('Last name').fill('Obi');
  await page.getByRole('button', { name: 'Submit verification' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(verifyPayload).toEqual({
    document_type: 'NIN',
    document_number: '12345678901',
    first_name: 'Amaka',
    last_name: 'Obi',
    date_of_birth: '1995-06-15',
  });
});

test('rejected verification shows mismatch copy and cooldown', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: false,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'null');

  await page.route('**/api/v1/kyc/verify', async (route) => {
    await fulfillJson(route, {
      status: 'rejected',
      message: 'Submitted details did not match identity records.',
      smile_job_id: '500000002',
    });
  });
  await loginAs(page, { kycVerified: false, riskAssessed: true }, '/kyc');

  await page.getByLabel('Document number').fill('11111111111');
  await page.getByLabel('First name').fill('Amaka');
  await page.getByLabel('Last name').fill('Obi');
  await page.getByRole('button', { name: 'Submit verification' }).click();

  await expect(page.getByText('Details did not match records')).toBeVisible();
  await expect(page.getByText(/Double-check your identity slip or card details/i)).toBeVisible();
  await expect(page.getByText(/Retry cooldown active/i)).toBeVisible();
});

test('failed verification shows technical/provider copy and cooldown', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: false,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'null');

  await page.route('**/api/v1/kyc/verify', async (route) => {
    await fulfillJson(route, {
      status: 'failed',
      message: 'Verification could not be completed due to a technical issue.',
      smile_job_id: '500000003',
    });
  });
  await loginAs(page, { kycVerified: false, riskAssessed: true }, '/kyc');

  await page.getByLabel('Document number').fill('22222222222');
  await page.getByLabel('First name').fill('Amaka');
  await page.getByLabel('Last name').fill('Obi');
  await page.getByRole('button', { name: 'Submit verification' }).click();

  await expect(page.getByText('Verification could not be completed', { exact: true })).toBeVisible();
  await expect(page.getByText(/This is not caused by your details/i)).toBeVisible();
  await expect(page.getByText(/Retry cooldown active/i)).toBeVisible();
});

test('pending status shows waiting state and long-running timeout state', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: false,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  let statusRequestCount = 0;
  await page.route('**/api/v1/kyc/status', async (route) => {
    statusRequestCount += 1;
    await fulfillJson(route, {
      status: 'pending',
      document_type: 'NIN',
      verified_at: null,
      rejection_reason: null,
    });
  });
  await page.clock.install();
  await loginAs(page, { kycVerified: false, riskAssessed: true }, '/kyc');
  await expect(page.getByText('Verification in progress')).toBeVisible();
  const longRunningStatus = page.getByText('Verification is taking longer than expected');

  for (let count = 0; count < 10; count += 1) {
    await page.clock.fastForward(3_000);
    await page.waitForTimeout(0);
  }

  for (let count = 0; count < 50; count += 1) {
    await page.clock.fastForward(10_000);
    await page.waitForTimeout(0);
    if (await longRunningStatus.isVisible().catch(() => false)) break;
  }

  await expect(longRunningStatus).toBeVisible();
  await expect(page.getByText(/stopped polling for now/i)).toBeVisible();
  expect(statusRequestCount).toBeGreaterThan(10);
});

test('dashboard banner routes unverified users to KYC', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: false,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'null');
  await mockDashboard(page, { kycVerified: false, riskAssessed: true });
  await loginAs(page, { kycVerified: false, riskAssessed: true });

  await expect(page.getByRole('heading', { name: 'Verify your KYC' })).toBeVisible();
  await page.getByRole('link', { name: 'Verify now' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/kyc\?redirect=%2Fdashboard$/);
});

test('verified users do not see the dashboard banner and retain assessed content', async ({ page }) => {
  await mockUserProfile(page, {
    kycVerified: true,
    riskAssessed: true,
    firstName: 'Amaka',
    lastName: 'Obi',
    email: 'amaka@example.com',
    dateOfBirth: '1995-06-15',
    city: 'Lagos',
  });
  await mockKycStatus(page, 'verified');
  await mockDashboard(page, { kycVerified: true, riskAssessed: true });
  await loginAs(page, { kycVerified: true, riskAssessed: true });
  await expect(page.getByRole('heading', { name: 'Verify your KYC' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Financial Risk Level' })).toBeVisible();
});

async function mockDashboard(
  page: Page,
  flags: { kycVerified: boolean; riskAssessed: boolean },
) {
  await page.route('**/api/v1/dashboard/overview', async (route) => {
    await fulfillJson(route, {
      premiums_bought: flags.riskAssessed ? 2 : 0,
      monthly_income_band: flags.riskAssessed ? 'NGN 300,000-500,000' : null,
      safety_buffer: flags.riskAssessed ? 'Three months' : null,
      recommended_plans_count: flags.riskAssessed ? 3 : 0,
      income_stability: null,
      has_assessment: flags.riskAssessed,
    });
  });
  await page.route('**/api/v1/risk/assessment', async (route) => {
    await fulfillJson(route, {
      applicant: {
        first_name: 'Amaka',
        last_name: 'Obi',
        age: 31,
        gender: 'female',
        marital_status: 'single',
        state: 'Lagos',
        city: 'Ikeja',
      },
      category: 'tech_freelancer',
      pillar_scores: { income: 72, client: 45, safety: 80, equipment: 35, health: 55 },
      overall_score: 68.5,
      risk_profile: 'Moderate Risk',
      recommendations: ['Build an emergency reserve.'],
      recommended_categories: ['Income Protection'],
      ai_insights: 'Income is moderately stable.',
    });
  });
}

async function loginAs(
  page: Page,
  flags: {
    kycVerified: boolean;
    riskAssessed: boolean;
  },
  redirectPath: '/dashboard' | '/kyc' = '/dashboard'
) {
  await page.context().addCookies([
    {
      name: 'gs_refresh_token',
      value: 'refresh-token',
      url: E2E_BASE_URL,
      httpOnly: true,
      sameSite: 'Strict',
    },
  ]);

  await page.unroute('**/api/auth/refresh');
  await page.route('**/api/auth/refresh', async (route) => {
    await fulfillJson(route, {
      access_token: 'refresh-access-token',
      token_type: 'bearer',
      kyc_verified: flags.kycVerified,
      risk_assessed: flags.riskAssessed,
    });
  });

  await page.goto(redirectPath);
  await expect(page).toHaveURL(new RegExp(`${redirectPath.replace('/', '\\/')}(\\?|$)`));
}

async function mockKycStatus(
  page: Page,
  status: 'null' | 'pending' | 'verified' | 'rejected' | 'failed'
) {
  await page.route('**/api/v1/kyc/status', async (route) => {
    if (status === 'null') {
      await fulfillJson(route, {
        status: null,
        document_type: null,
        verified_at: null,
        rejection_reason: null,
      });
      return;
    }

    await fulfillJson(route, {
      status,
      document_type: 'NIN',
      verified_at: status === 'verified' ? '2026-04-24T10:00:00Z' : null,
      rejection_reason:
        status === 'rejected'
          ? 'Submitted details did not match identity records.'
          : status === 'failed'
            ? 'Verification could not be completed due to a technical issue.'
            : null,
    });
  });
}

async function mockUserProfile(
  page: Page,
  options: {
    kycVerified: boolean;
    riskAssessed: boolean;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    city: string;
  }
) {
  await page.route('**/api/v1/users/me', async (route) => {
    await fulfillJson(route, {
      user: {
        id: '00000000-0000-4000-8000-000000000001',
        email: options.email,
        first_name: options.firstName,
        last_name: options.lastName,
        phone_number: null,
        status: 'active',
        role: 'user',
        email_verified: true,
        last_login_at: '2026-04-24T10:00:00Z',
        created_at: '2026-04-24T09:00:00Z',
      },
      profile: {
        date_of_birth: options.dateOfBirth,
        gender: null,
        occupation: null,
        gig_platform: null,
        average_monthly_income: null,
        years_of_experience: null,
        address_line_1: null,
        address_line_2: null,
        city: options.city,
        state: null,
        country: 'Nigeria',
        postal_code: null,
        profile_picture_url: null,
      },
      kyc_verified: options.kycVerified,
      risk_assessed: options.riskAssessed,
    });
  });
}

async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };

  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({
      status: 204,
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with',
      },
    });
    return;
  }

  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      ...corsHeaders,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}
