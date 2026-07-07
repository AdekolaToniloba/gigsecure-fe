import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
} from '@playwright/test';

const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;

const unassessedOverview = {
  premiums_bought: 0,
  monthly_income_band: null,
  safety_buffer: null,
  recommended_plans_count: 0,
  income_stability: null,
  has_assessment: false,
};

const assessedOverview = {
  premiums_bought: 3,
  monthly_income_band: 'NGN 300,000-500,000 per month',
  safety_buffer: 'Approximately three months of essential expenses',
  recommended_plans_count: 4,
  income_stability: {
    score: 42,
    classification: 'Moderate stability',
    graph_points: [18, 26, 22, 35, 31, 42, 38, 47],
  },
  has_assessment: true,
};

const latestAssessment = {
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
  pillar_scores: {
    income: 72,
    client: 45,
    safety: 80,
    equipment: 35,
    health: 55,
  },
  overall_score: 68.5,
  risk_profile: 'Moderate Risk',
  recommendations: [
    'Build an emergency reserve that covers essential expenses.',
    'Consider income protection suited to irregular freelance earnings.',
  ],
  recommended_categories: ['Income Protection'],
  ai_insights: 'Income is moderately stable with some client concentration risk.',
};

test('unauthenticated users are redirected without protected dashboard content', async ({ page }) => {
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, { detail: 'No refresh token' }, 401),
  );

  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
});

test('silent refresh preserves loading geometry and never flashes protected content', async ({
  page,
  context,
}) => {
  await seedRefreshCookie(context);
  let releaseRefresh: (() => void) | undefined;
  let releaseOverview: (() => void) | undefined;
  const refreshReleased = new Promise<void>((resolve) => {
    releaseRefresh = resolve;
  });
  const overviewReleased = new Promise<void>((resolve) => {
    releaseOverview = resolve;
  });

  await page.route('**/api/auth/refresh', async (route) => {
    await refreshReleased;
    await fulfillJson(route, sessionResponse({ kycVerified: true, riskAssessed: false }));
  });
  const api = await mockDashboardApi(page, {
    kycVerified: true,
    riskAssessed: false,
    overview: unassessedOverview,
    onOverview: async (route) => {
      await overviewReleased;
      await fulfillJson(route, unassessedOverview);
    },
  });

  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('status', { name: 'Loading protected application' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);

  releaseRefresh?.();
  await expect(page.getByRole('status', { name: 'Loading dashboard overview' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toHaveCount(0);
  releaseOverview?.();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  expect(api.overviewRequests()).toBe(1);
});

for (const scenario of [
  { name: 'unassessed and KYC verified', assessed: false, kycVerified: true },
  { name: 'unassessed and KYC unverified', assessed: false, kycVerified: false },
  { name: 'assessed and KYC verified', assessed: true, kycVerified: true },
  { name: 'assessed and KYC unverified', assessed: true, kycVerified: false },
] as const) {
  test(`renders the ${scenario.name} dashboard with one overview request`, async ({
    page,
    context,
  }) => {
    const api = await openDashboard(page, context, {
      kycVerified: scenario.kycVerified,
      riskAssessed: scenario.assessed,
      overview: scenario.assessed ? assessedOverview : unassessedOverview,
    });

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.locator('[data-dashboard-state]')).toHaveAttribute(
      'data-dashboard-state',
      scenario.assessed ? 'assessed' : 'unassessed',
    );
    await expect(page.getByRole('heading', { name: 'Verify your KYC' })).toHaveCount(
      scenario.kycVerified ? 0 : 1,
    );

    if (scenario.assessed) {
      await expect(page.getByRole('heading', { name: 'Here’s your financial snapshot.' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Moderate Risk, score 68.5 out of 100' })).toBeVisible();
      await expect(page.getByRole('img', { name: /Stability trend values/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Recommended actions' })).toBeVisible();
      await expect(page.getByRole('status', { name: 'Notifications unavailable' })).toBeVisible();
      expect(api.assessmentRequests()).toBe(1);
    } else {
      await expect(page.getByRole('heading', { name: 'Lets get you protected' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'No stability data yet' })).toBeVisible();
      await expect(page.getByText('Not available', { exact: true })).toHaveCount(2);
      expect(api.assessmentRequests()).toBe(0);
    }

    expect(api.overviewRequests()).toBe(1);
  });
}

test('dashboard actions navigate to KYC, assessment, and marketplace destinations', async ({
  page,
  context,
}) => {
  await openDashboard(page, context, {
    kycVerified: false,
    riskAssessed: false,
    overview: unassessedOverview,
  });

  const verifyLink = page.getByRole('link', { name: 'Verify now' });
  await expect(verifyLink).toHaveAttribute('href', '/kyc?redirect=%2Fdashboard');
  await verifyLink.click();
  await expect(page).toHaveURL(/\/kyc\?redirect=%2Fdashboard$/);

  await page.goBack();
  await page.getByRole('link', { name: 'Take Risk Assessment' }).click();
  await expect(page).toHaveURL(/\/assessment$/);

  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'Explore protection plans' }).click();
  await expect(page).toHaveURL(/\/marketplace$/);
});

test('overview error keeps the shell usable and retries successfully', async ({ page, context }) => {
  await seedRefreshCookie(context);
  await mockRefresh(page, { kycVerified: true, riskAssessed: false });
  let overviewRequests = 0;
  await mockDashboardApi(page, {
    kycVerified: true,
    riskAssessed: false,
    overview: unassessedOverview,
    onOverview: async (route) => {
      overviewRequests += 1;
      if (overviewRequests === 1) {
        await fulfillJson(route, { detail: 'Dashboard overview is temporarily unavailable.' }, 400);
        return;
      }
      await fulfillJson(route, unassessedOverview);
    },
  });

  await page.goto('/dashboard');
  await expect(
    page.getByRole('alert').filter({ hasText: 'Dashboard unavailable' }),
  ).toContainText('Dashboard overview is temporarily unavailable.');
  await expect(page.getByRole('navigation', { name: 'App navigation' })).toBeVisible();

  await page.getByRole('button', { name: 'Try again' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Lets get you protected' })).toBeVisible();
  expect(overviewRequests).toBe(2);
});

test('mobile drawer traps focus, navigates, dismisses, and restores its opener', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDashboard(page, context, {
    kycVerified: true,
    riskAssessed: false,
    overview: unassessedOverview,
  });

  const opener = page.getByRole('button', { name: 'Open navigation menu' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const drawer = page.getByRole('dialog', { name: 'Application navigation' });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await page.keyboard.press('Shift+Tab');
  await expect(drawer.getByRole('link', { name: 'Explore Marketplace' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Close navigation menu' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toBeHidden();
  await expect(opener).toBeFocused();

  await opener.click();
  await drawer.getByRole('link', { name: 'Risk Assessment' }).click();
  await expect(page).toHaveURL(/\/assessment$/);
});

test('notification panel traps and restores focus without notification network calls', async ({
  page,
  context,
}) => {
  const notificationRequests: string[] = [];
  page.on('request', (request) => {
    if (/\/api\/.*(notification|mark.?read)/i.test(request.url())) {
      notificationRequests.push(request.url());
    }
  });
  await openDashboard(page, context, {
    kycVerified: true,
    riskAssessed: true,
    overview: assessedOverview,
  });

  const opener = page.getByRole('button', { name: 'Open notifications' });
  await opener.focus();
  await page.keyboard.press('Enter');
  const panel = page.getByRole('dialog', { name: 'Notifications' });
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('button', { name: 'Back' })).toBeFocused();
  await expect(panel.getByRole('status', { name: 'Notifications unavailable' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden');

  await page.keyboard.press('Tab');
  await expect(panel.getByRole('button', { name: 'Back' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(opener).toBeFocused();
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(notificationRequests).toEqual([]);
});

test('dashboard has no horizontal page overflow at required viewport widths', async ({
  page,
  context,
}) => {
  await openDashboard(page, context, {
    kycVerified: false,
    riskAssessed: true,
    overview: assessedOverview,
  });

  for (const width of [320, 390, 768, 1024, 1512]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 1000 : 844 });
    await expect.poll(() => page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    )).toBe(true);
  }
});

type DashboardApiOptions = {
  kycVerified: boolean;
  riskAssessed: boolean;
  overview: typeof unassessedOverview | typeof assessedOverview;
  onOverview?: (route: Route) => Promise<void>;
};

async function openDashboard(
  page: Page,
  context: BrowserContext,
  options: DashboardApiOptions,
) {
  await seedRefreshCookie(context);
  await mockRefresh(page, options);
  const api = await mockDashboardApi(page, options);
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  return api;
}

async function mockRefresh(
  page: Page,
  flags: { kycVerified: boolean; riskAssessed: boolean },
) {
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, sessionResponse(flags)),
  );
}

async function mockDashboardApi(page: Page, options: DashboardApiOptions) {
  let overviewRequests = 0;
  let assessmentRequests = 0;

  await page.route('**/api/v1/users/me', async (route) => {
    if (await fulfillPreflight(route)) return;
    expect(route.request().headers().authorization).toBe('Bearer dashboard-e2e-token');
    await fulfillJson(route, userProfile(options));
  });

  await page.route('**/api/v1/dashboard/overview', async (route) => {
    if (await fulfillPreflight(route)) return;
    overviewRequests += 1;
    expect(route.request().headers().authorization).toBe('Bearer dashboard-e2e-token');
    if (options.onOverview) {
      await options.onOverview(route);
      return;
    }
    await fulfillJson(route, options.overview);
  });

  await page.route('**/api/v1/risk/assessment', async (route) => {
    if (await fulfillPreflight(route)) return;
    assessmentRequests += 1;
    expect(route.request().headers().authorization).toBe('Bearer dashboard-e2e-token');
    await fulfillJson(route, latestAssessment);
  });

  return {
    overviewRequests: () => overviewRequests,
    assessmentRequests: () => assessmentRequests,
  };
}

function sessionResponse(flags: { kycVerified: boolean; riskAssessed: boolean }) {
  return {
    access_token: 'dashboard-e2e-token',
    token_type: 'bearer',
    kyc_verified: flags.kycVerified,
    risk_assessed: flags.riskAssessed,
  };
}

function userProfile(options: { kycVerified: boolean; riskAssessed: boolean }) {
  return {
    user: {
      id: '00000000-0000-4000-8000-000000000020',
      email: 'amaka@example.com',
      first_name: 'Amaka',
      last_name: 'Obi',
      phone_number: null,
      status: 'active',
      email_verified: true,
      last_login_at: '2026-07-07T08:00:00Z',
      created_at: '2026-01-10T09:00:00Z',
    },
    profile: null,
    kyc_verified: options.kycVerified,
    risk_assessed: options.riskAssessed,
  };
}

async function seedRefreshCookie(context: BrowserContext) {
  await context.addCookies([{
    name: 'gs_refresh_token',
    value: 'dashboard-refresh-token',
    url: E2E_BASE_URL,
    httpOnly: true,
    sameSite: 'Strict',
  }]);
}

async function fulfillPreflight(route: Route) {
  if (route.request().method() !== 'OPTIONS') return false;
  const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
  await route.fulfill({
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with',
      Vary: 'Origin',
    },
  });
  return true;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      Vary: 'Origin',
    },
    body: JSON.stringify(body),
  });
}
