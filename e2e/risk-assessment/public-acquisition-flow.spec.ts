import { expect, test } from '@playwright/test';
import {
  WAITLIST_ACCESS_TOKEN,
  completeAssessmentWizard,
  fulfillJson,
  mockAnonymousRefresh,
  publicAssessmentResponse,
  riskCategories,
  riskQuestions,
} from './helpers';

test.describe('public risk assessment acquisition flow', () => {
  test.beforeEach(async ({ page }) => {
    await mockAnonymousRefresh(page);
  });

  test('public informational CTA routes to waitlist and /assessment without a token returns to waitlist', async ({
    page,
  }) => {
    await page.goto('/risk-assessment');
    await page.getByRole('button', { name: 'Take the Assessment' }).click();
    await expect(page).toHaveURL(/\/waitlist$/);

    await page.goto('/assessment');
    await expect(page).toHaveURL(/\/waitlist$/);
    await expect(page.getByRole('heading', { name: 'Know your risk. Before it costs you.' })).toBeVisible();
  });

  test('waitlist signup hands off to the shared wizard, keeps full-session APIs idle, and renders the public report', async ({
    page,
  }) => {
    const riskRequests: Array<{ url: string; authorization: string | undefined }> = [];
    const fullSessionOnlyRequests: string[] = [];

    await page.route('**/api/auth/waitlist', async (route) => {
      expect(route.request().headers()['x-requested-with']).toBe('XMLHttpRequest');
      expect(route.request().postDataJSON()).toEqual({
        email: 'oluwakanyinsola@example.com',
        first_name: 'Oluwakanyinsola',
        last_name: 'Adebayo-Akinyemi',
      });

      await fulfillJson(route, {
        message: 'Added to the GigSecure waitlist',
        user_id: 'waitlist-user-0001',
        access_token: WAITLIST_ACCESS_TOKEN,
        token_type: 'bearer',
      });
    });

    for (const url of [
      '**/api/v1/users/me',
      '**/api/v1/dashboard/overview',
      '**/api/v1/kyc/status',
      '**/api/v1/marketplace/recommendations**',
    ]) {
      await page.route(url, async (route) => {
        fullSessionOnlyRequests.push(new URL(route.request().url()).pathname);
        await fulfillJson(route, { detail: 'Unexpected full-session request' }, 500);
      });
    }

    await page.route('**/api/v1/risk/categories', async (route) => {
      riskRequests.push({
        url: route.request().url(),
        authorization: route.request().headers().authorization,
      });
      expect(route.request().headers().authorization).toBe(`Bearer ${WAITLIST_ACCESS_TOKEN}`);
      await fulfillJson(route, riskCategories);
    });

    await page.route('**/api/v1/risk/questions**', async (route) => {
      riskRequests.push({
        url: route.request().url(),
        authorization: route.request().headers().authorization,
      });
      expect(route.request().headers().authorization).toBe(`Bearer ${WAITLIST_ACCESS_TOKEN}`);
      expect(new URL(route.request().url()).searchParams.get('category')).toBe('tech_freelancer');
      await fulfillJson(route, riskQuestions);
    });

    await page.route('**/api/v1/risk/assessment/tech_freelancer', async (route) => {
      riskRequests.push({
        url: route.request().url(),
        authorization: route.request().headers().authorization,
      });
      expect(route.request().headers().authorization).toBe(`Bearer ${WAITLIST_ACCESS_TOKEN}`);
      expect(route.request().postDataJSON()).toMatchObject({
        first_name: 'Oluwakanyinsola',
        last_name: 'Adebayo-Akinyemi',
        date_of_birth: '15/06/1995',
        gender: 'female',
        state: 'Lagos',
        city: 'Ikeja',
        occupation: 'tech_freelancer',
        marital_status: 'Single',
        job_type: 'Web Development',
        freelance_duration: '3-5 years',
        client_geography: 'Global',
        work_mode: 'Fully remote',
        weekly_hours: '20-40',
        monthly_income_band: '₦100k-₦500k',
        income_stability: 'Somewhat stable',
        income_sources: '2-3',
        biggest_client_loss: '25-50%',
        past_risks: ['Late payments'],
        top_worries: ['Income loss', 'Equipment damage'],
        equipment_dependency: 'Completely dependent',
        pre_existing_conditions: false,
        chronic_illness: false,
        smoker: false,
        health_rating: 4,
        travel_frequency: 'Rarely',
        survival_3_months: 'Yes, but tight',
        savings_duration: '1-2 months',
        insurance_types: ['None'],
        insurance_claims: 'Never',
        protection_priority: 'Income protection',
      });
      await fulfillJson(route, publicAssessmentResponse, 201);
    });

    await page.goto('/waitlist');
    await page.getByLabel('Email address').fill('oluwakanyinsola@example.com');
    await page.getByLabel('First name').fill('Oluwakanyinsola');
    await page.getByLabel('Last name').fill('Adebayo-Akinyemi');
    await page.getByRole('button', { name: 'Start my assessment' }).click();

    await expect(page).toHaveURL(/\/assessment$/);
    await expect(page).not.toHaveURL(/\/login/);
    await completeAssessmentWizard(page);

    await expect(page.getByRole('heading', { name: /here's your protection plan/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Risk exposure breakdown' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();

    expect(riskRequests.map((request) => request.authorization)).toEqual([
      `Bearer ${WAITLIST_ACCESS_TOKEN}`,
      `Bearer ${WAITLIST_ACCESS_TOKEN}`,
      `Bearer ${WAITLIST_ACCESS_TOKEN}`,
    ]);
    expect(fullSessionOnlyRequests).toEqual([]);
  });

  test('backend-rejected waitlist tokens recover to the expired waitlist banner without login', async ({
    page,
  }) => {
    const fullSessionOnlyRequests: string[] = [];

    await page.route('**/api/auth/waitlist', (route) =>
      fulfillJson(route, {
        message: 'Added to the GigSecure waitlist',
        user_id: 'waitlist-user-0001',
        access_token: WAITLIST_ACCESS_TOKEN,
        token_type: 'bearer',
      }),
    );

    for (const url of [
      '**/api/v1/users/me',
      '**/api/v1/dashboard/overview',
      '**/api/v1/kyc/status',
      '**/api/v1/marketplace/recommendations**',
    ]) {
      await page.route(url, async (route) => {
        fullSessionOnlyRequests.push(new URL(route.request().url()).pathname);
        await fulfillJson(route, { detail: 'Unexpected full-session request' }, 500);
      });
    }

    await page.route('**/api/v1/risk/categories', (route) =>
      fulfillJson(route, { detail: 'Token is invalid or expired' }, 401),
    );

    await page.goto('/waitlist');
    await page.getByLabel('Email address').fill('oluwakanyinsola@example.com');
    await page.getByLabel('First name').fill('Oluwakanyinsola');
    await page.getByLabel('Last name').fill('Adebayo-Akinyemi');
    await page.getByRole('button', { name: 'Start my assessment' }).click();

    await expect(page).toHaveURL(/\/waitlist\?expired=true$/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('status')).toContainText('Your session expired');
    expect(fullSessionOnlyRequests).toEqual([]);
  });
});
