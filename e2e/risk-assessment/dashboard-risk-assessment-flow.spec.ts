import {
  expect,
  test,
  type Page,
  type Route,
} from '@playwright/test';
import {
  DASHBOARD_ACCESS_TOKEN,
  WAITLIST_ACCESS_TOKEN,
  completeAssessmentWizard,
  dashboardAssessmentResponse,
  dashboardProducts,
  dashboardProfile,
  expectNoHorizontalOverflow,
  fulfillJson,
  mockAnonymousRefresh,
  mockRefresh,
  riskCategories,
  riskQuestions,
  seedRefreshCookie,
  updatedDashboardAssessmentResponse,
} from './helpers';

test('unauthenticated direct entry to /dashboard/risk-assessment redirects without protected content', async ({
  page,
}) => {
  await mockAnonymousRefresh(page);

  await page.goto('/dashboard/risk-assessment');

  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Frisk-assessment$/);
  await expect(page.getByRole('heading', { name: 'Risk assessment' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /let's get to know you/i })).toHaveCount(0);
});

test('waitlist-token assessment can use risk APIs, while protected dashboard navigation never starts full-session requests', async ({
  page,
}) => {
  await mockAnonymousRefresh(page);

  let riskCategoryRequests = 0;
  const fullSessionOnlyRequests: string[] = [];

  await page.route('**/api/auth/waitlist', (route) =>
    fulfillJson(route, {
      message: 'Added to the GigSecure waitlist',
      user_id: 'waitlist-user-0001',
      access_token: WAITLIST_ACCESS_TOKEN,
      token_type: 'bearer',
    }),
  );

  await page.route('**/api/v1/risk/categories', async (route) => {
    riskCategoryRequests += 1;
    expect(route.request().headers().authorization).toBe(`Bearer ${WAITLIST_ACCESS_TOKEN}`);
    await fulfillJson(route, riskCategories);
  });

  await page.route('**/api/v1/risk/questions**', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${WAITLIST_ACCESS_TOKEN}`);
    await fulfillJson(route, riskQuestions);
  });

  for (const url of [
    '**/api/v1/users/me',
    '**/api/v1/dashboard/overview',
    '**/api/v1/kyc/status',
    '**/api/v1/marketplace/recommendations**',
  ]) {
    await page.route(url, async (route) => {
      fullSessionOnlyRequests.push(new URL(route.request().url()).pathname);
      await fulfillJson(route, { detail: 'Protected request should not start' }, 500);
    });
  }

  await page.goto('/waitlist');
  await page.getByLabel('Email address').fill('waitlist@example.com');
  await page.getByLabel('First name').fill('Waitlist');
  await page.getByLabel('Last name').fill('User');
  await page.getByRole('button', { name: 'Start my assessment' }).click();

  await expect(page).toHaveURL(/\/assessment$/);
  await expect(page.getByRole('heading', { name: "Let's get to know you" })).toBeVisible();
  expect(riskCategoryRequests).toBe(1);
  expect(fullSessionOnlyRequests).toEqual([]);

  await page.goto('/dashboard/risk-assessment');
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Frisk-assessment$/);
  await expect(page.getByRole('heading', { name: 'Risk assessment' })).toHaveCount(0);
  expect(fullSessionOnlyRequests).toEqual([]);
});

test('unassessed full-session users get profile prefill, can submit, and see the assessed route survive a refresh', async ({
  page,
  context,
}) => {
  const sessionFlags = { kycVerified: true, riskAssessed: false };
  await seedRefreshCookie(context);
  await mockRefresh(page, sessionFlags);
  const api = await mockDashboardRiskAssessmentRoutes(page, sessionFlags);

  await page.goto('/dashboard/risk-assessment');
  await expect(page.getByRole('heading', { name: 'Risk assessment' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take assessment' })).toBeVisible();

  await page.getByRole('button', { name: 'Take assessment' }).click();
  await expect(page.getByRole('heading', { name: "Let's get to know you" })).toBeVisible();
  await expect(page.locator('#first_name')).toHaveValue('Amara');
  await expect(page.locator('#last_name')).toHaveValue('Okafor');
  await expect(page.locator('#date_of_birth')).toContainText('12/04/1994');
  await expect(page.locator('#state')).toContainText('Lagos');
  await expect(page.locator('#city')).toContainText('Ikeja');
  await expect(page.locator('#occupation')).toContainText('tech_freelancer');

  await completeAssessmentWizard(page, { useDashboardPrefill: true });

  await expect(page.getByRole('heading', { name: /risk profile/i })).toBeVisible();
  await expect(page.getByText('Moderate Risk')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Update assessment' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recommended for you' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible();
  expect(api.latestRequests()).toBe(0);
  expect(api.recommendationRequests()).toBe(1);

  await page.reload();

  await expect(page.getByRole('heading', { name: /risk profile/i })).toBeVisible();
  await expect(page.getByText('Moderate Risk')).toBeVisible();
  expect(api.latestRequests()).toBe(1);
});

test('assessed users can cancel reassessment and then submit an updated report', async ({
  page,
  context,
}) => {
  const sessionFlags = { kycVerified: true, riskAssessed: true };
  await seedRefreshCookie(context);
  await mockRefresh(page, sessionFlags);
  const api = await mockDashboardRiskAssessmentRoutes(page, sessionFlags, {
    getSubmissionResponse: (submissionCount) =>
      submissionCount === 1 ? updatedDashboardAssessmentResponse : updatedDashboardAssessmentResponse,
  });

  await page.goto('/dashboard/risk-assessment');
  await expect(page.getByRole('button', { name: 'Update assessment' })).toBeVisible();

  await page.getByRole('button', { name: 'Update assessment' }).click();
  await expect(page.getByRole('alertdialog', { name: 'Start a new assessment?' })).toBeVisible();
  await page.getByRole('button', { name: 'Keep current report' }).click();
  await expect(page.getByRole('button', { name: 'Update assessment' })).toBeFocused();

  await page.getByRole('button', { name: 'Update assessment' }).click();
  await page.getByRole('button', { name: 'Start new assessment' }).click();
  await expect(page.getByRole('status')).toContainText("You're updating your assessment");
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('button', { name: 'Update assessment' })).toBeVisible();

  await page.getByRole('button', { name: 'Update assessment' }).click();
  await page.getByRole('button', { name: 'Start new assessment' }).click();
  await completeAssessmentWizard(page, { useDashboardPrefill: true });

  await expect(page.getByRole('heading', { name: /updated obi.s risk profile/i })).toBeVisible();
  await expect(page.getByText('Updated Risk Profile')).toBeVisible();
  expect(api.submissionRequests()).toBe(1);
});

test('latest 404 reconciliation errors stay recoverable on the dashboard route', async ({
  page,
  context,
}) => {
  const sessionFlags = { kycVerified: true, riskAssessed: true };
  await seedRefreshCookie(context);
  await mockRefresh(page, sessionFlags);
  let latestMode: 'not-found' | 'success' = 'not-found';
  const api = await mockDashboardRiskAssessmentRoutes(page, sessionFlags, {
    onLatest: async (route) => {
      if (latestMode === 'not-found') {
        await fulfillJson(route, { detail: 'No risk assessment found' }, 404);
        return;
      }
      await fulfillJson(route, dashboardAssessmentResponse);
    },
  });

  await page.goto('/dashboard/risk-assessment');

  const reconciliationAlert = page
    .getByRole('alert')
    .filter({ hasText: 'Assessment record needs attention' });
  await expect(reconciliationAlert).toContainText('Assessment record needs attention');
  latestMode = 'success';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: /risk profile/i })).toBeVisible();
  expect(api.latestRequests()).toBe(2);
});

test('invalid latest assessment payloads show a retryable route-local error', async ({
  page,
  context,
}) => {
  const sessionFlags = { kycVerified: true, riskAssessed: true };
  await seedRefreshCookie(context);
  await mockRefresh(page, sessionFlags);
  let latestMode: 'malformed' | 'success' = 'malformed';
  const api = await mockDashboardRiskAssessmentRoutes(page, sessionFlags, {
    onLatest: async (route) => {
      if (latestMode === 'malformed') {
        await fulfillJson(route, {
          ...dashboardAssessmentResponse,
          overall_score: 101,
        });
        return;
      }
      await fulfillJson(route, dashboardAssessmentResponse);
    },
  });

  await page.goto('/dashboard/risk-assessment');

  const latestAlert = page
    .getByRole('alert')
    .filter({ hasText: 'Risk report unavailable' });
  await expect(latestAlert).toContainText('Risk report unavailable');
  await expect(latestAlert).toContainText(
    'Invalid API response shape in riskService.getLatestAssessment',
  );
  latestMode = 'success';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: /risk profile/i })).toBeVisible();
  expect(api.latestRequests()).toBe(2);
});

test('the protected route keeps mobile navigation and overflow stable on risk-assessment', async ({
  page,
  context,
}) => {
  const sessionFlags = { kycVerified: true, riskAssessed: false };
  await page.setViewportSize({ width: 390, height: 844 });
  await seedRefreshCookie(context);
  await mockRefresh(page, sessionFlags);
  await mockDashboardRiskAssessmentRoutes(page, sessionFlags);

  await page.goto('/dashboard/risk-assessment');
  await expect(page.getByRole('button', { name: 'Take assessment' })).toBeVisible();
  await expectNoHorizontalOverflow(page, [320, 390, 768, 1024, 1512]);

  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole('button', { name: 'Open navigation menu' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog', { name: 'Application navigation' });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();
});

type SessionFlags = {
  kycVerified: boolean;
  riskAssessed: boolean;
};

type DashboardRouteOptions = {
  onLatest?: (route: Route, latestRequestCount: number) => Promise<void>;
  getSubmissionResponse?: (submissionRequestCount: number) => unknown;
};

async function mockDashboardRiskAssessmentRoutes(
  page: Page,
  sessionFlags: SessionFlags,
  options: DashboardRouteOptions = {},
) {
  let latestRequestCount = 0;
  let submissionRequestCount = 0;
  let recommendationRequestCount = 0;

  await page.route('**/api/v1/users/me', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    await fulfillJson(route, dashboardProfile(sessionFlags));
  });

  await page.route('**/api/v1/risk/categories', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    await fulfillJson(route, riskCategories);
  });

  await page.route('**/api/v1/risk/questions**', async (route) => {
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    expect(new URL(route.request().url()).searchParams.get('category')).toBe('tech_freelancer');
    await fulfillJson(route, riskQuestions);
  });

  await page.route('**/api/v1/risk/assessment/tech_freelancer', async (route) => {
    submissionRequestCount += 1;
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    sessionFlags.riskAssessed = true;
    await fulfillJson(
      route,
      options.getSubmissionResponse?.(submissionRequestCount) ?? dashboardAssessmentResponse,
      201,
    );
  });

  await page.route('**/api/v1/risk/assessment', async (route) => {
    latestRequestCount += 1;
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    if (options.onLatest) {
      await options.onLatest(route, latestRequestCount);
      return;
    }
    await fulfillJson(route, dashboardAssessmentResponse);
  });

  await page.route('**/api/v1/marketplace/recommendations**', async (route) => {
    recommendationRequestCount += 1;
    expect(route.request().headers().authorization).toBe(`Bearer ${DASHBOARD_ACCESS_TOKEN}`);
    expect(new URL(route.request().url()).searchParams.get('per_category')).toBe('3');
    await fulfillJson(route, {
      recommended_categories: ['Income Protection', 'Equipment Protection'],
      items: dashboardProducts,
    });
  });

  return {
    latestRequests: () => latestRequestCount,
    submissionRequests: () => submissionRequestCount,
    recommendationRequests: () => recommendationRequestCount,
  };
}
