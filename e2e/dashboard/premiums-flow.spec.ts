import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
} from '@playwright/test';

const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;

type PolicyFixture = {
  id: string;
  status: string;
  display_status: string;
  coverage_amount: string;
  premium_amount: string;
  premium_currency: string;
  renewal_frequency: string;
  start_date: string | null;
  end_date: string | null;
  purchased_at: string | null;
  external_policy_id: string | null;
  created_at: string;
  product: {
    id: string;
    name: string;
    category: string;
    provider_name: string;
    provider_slug: string;
  };
};

const policies: PolicyFixture[] = [
  policyFixture('pol-income-active', 'active', 'Active', 'Income Shield for Gig Workers', 'AXA Mansard', 'Income Protection'),
  policyFixture('pol-equipment-due', 'active', 'Due Soon', 'Equipment Protection Plus', 'Leadway Assurance', 'Equipment Protection'),
  policyFixture('pol-health-expired', 'expired', 'Expired', 'Flexible Health Support', 'Zurich Nigeria', 'Health Protection'),
];

test.describe('dashboard premiums flow', () => {
  test('unauthenticated direct entry redirects to login', async ({ page }) => {
    await page.goto('/dashboard/premiums');

    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard%2Fpremiums/);
    await expect(page.getByRole('heading', { name: 'Premiums Bought' })).toBeHidden();
  });

  test('authenticated user can view summary, filter policies, and open/close details', async ({
    page,
    context,
  }) => {
    await openPremiums(page, context);

    await expect(page.getByRole('link', { name: 'Premiums Bought' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.getByRole('heading', { name: 'Premiums Bought' })).toBeVisible();
    await expect(page.getByText('₦690,000.00')).toBeVisible();
    await expect(page.getByRole('button', { name: /View Details/ }).first()).toBeVisible();

    await page.getByRole('button', { name: 'All Active' }).click();
    await expect(page.getByRole('heading', { name: 'Equipment Protection Plus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Flexible Health Support' })).toBeHidden();

    await page.getByRole('button', { name: 'Due Soon' }).click();
    await expect(page.getByRole('heading', { name: 'Equipment Protection Plus' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Income Shield for Gig Workers' })).toBeHidden();

    await page.getByRole('button', { name: 'Expired' }).click();
    await expect(page.getByRole('heading', { name: 'Flexible Health Support' })).toBeVisible();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    const detailsButton = page.getByRole('button', { name: 'View Details' }).first();
    await detailsButton.click();
    const panel = page.getByRole('dialog', { name: 'Income Shield for Gig Workers' });
    await expect(panel).toBeVisible();
    await expect(panel.getByText(/policy document link is not available/i)).toBeVisible();
    await expect(panel.getByRole('button', { name: 'Download Report' })).toBeDisabled();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
    await expect(detailsButton).toBeFocused();

    await detailsButton.click();
    await expect(panel).toBeVisible();
    await page.getByTestId('policy-detail-slide-over-backdrop').click({ position: { x: 8, y: 8 } });
    await expect(panel).toBeHidden();

    await detailsButton.click();
    await page.getByRole('button', { name: 'Close policy details' }).click();
    await expect(panel).toBeHidden();

    await expectNoHorizontalOverflow(page);
  });

  test('empty state renders and mobile viewport has no horizontal overflow', async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openPremiums(page, context, { empty: true });

    await expect(page.getByText('₦0.00')).toBeVisible();
    await expect(page.getByRole('heading', {
      name: "You haven't activated any protection plans yet",
    })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore Recommended Plans' })).toHaveAttribute(
      'href',
      '/marketplace',
    );
    await expect(page.getByRole('link', { name: 'View My Risk Assessment' })).toHaveAttribute(
      'href',
      '/dashboard/risk-assessment',
    );

    for (const width of [320, 360, 390, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: width >= 1024 ? 960 : 844 });
      await expectNoHorizontalOverflow(page);
    }
  });
});

async function openPremiums(
  page: Page,
  context: BrowserContext,
  options: { empty?: boolean } = {},
) {
  await seedRefreshCookie(context);
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, {
      access_token: 'premiums-e2e-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: true,
    }),
  );
  await mockPoliciesApi(page, options);
  await page.goto('/dashboard/premiums');
}

async function mockPoliciesApi(page: Page, { empty = false }: { empty?: boolean } = {}) {
  await page.route('**/api/v1/policies**', async (route) => {
    if (await fulfillPreflight(route)) return;
    expect(route.request().headers().authorization).toBe('Bearer premiums-e2e-token');

    const url = new URL(route.request().url());
    const pathname = url.pathname;
    if (pathname.endsWith('/summary')) {
      await fulfillJson(route, empty
        ? { total_coverage: '0', active_count: 0, due_soon_count: 0 }
        : { total_coverage: '690000', active_count: 2, due_soon_count: 1 });
      return;
    }

    if (pathname.endsWith('/report')) {
      await route.fulfill({
        status: 501,
        contentType: 'application/json',
        headers: corsHeaders(route),
        body: JSON.stringify({ detail: 'Report contract is not available.' }),
      });
      return;
    }

    const policyId = pathname.split('/').at(-1);
    if (policyId && policyId !== 'policies') {
      const policy = policies.find((item) => item.id === policyId);
      await fulfillJson(route, policy ?? { detail: 'Policy not found' }, policy ? 200 : 404);
      return;
    }

    const statusFilter = url.searchParams.get('status_filter');
    const items = empty
      ? []
      : statusFilter
        ? policies.filter((policy) => policy.status === statusFilter)
        : policies;
    await fulfillJson(route, { items });
  });
}

async function seedRefreshCookie(context: BrowserContext) {
  await context.addCookies([{
    name: 'gs_refresh_token',
    value: 'premiums-refresh-token',
    url: E2E_BASE_URL,
    httpOnly: true,
    sameSite: 'Strict',
  }]);
}

async function fulfillPreflight(route: Route) {
  if (route.request().method() !== 'OPTIONS') return false;
  await route.fulfill({
    status: 204,
    headers: {
      ...corsHeaders(route),
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'authorization,content-type,x-requested-with',
    },
  });
  return true;
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  if (await fulfillPreflight(route)) return;
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: corsHeaders(route),
    body: JSON.stringify(body),
  });
}

function corsHeaders(route: Route) {
  const origin = route.request().headers().origin ?? new URL(route.request().url()).origin;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  await expect.poll(() =>
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
}

function policyFixture(
  id: string,
  status: string,
  displayStatus: string,
  productName: string,
  providerName: string,
  category: string,
): PolicyFixture {
  return {
    id,
    status,
    display_status: displayStatus,
    coverage_amount: status === 'expired' ? '90000' : status === 'active' && displayStatus === 'Due Soon' ? '250000' : '350000',
    premium_amount: status === 'expired' ? '4300' : status === 'active' && displayStatus === 'Due Soon' ? '6200' : '9500',
    premium_currency: 'NGN',
    renewal_frequency: 'monthly',
    start_date: status === 'expired' ? '2025-05-01' : '2026-06-01',
    end_date: status === 'expired' ? '2026-05-01' : '2027-06-01',
    purchased_at: '2026-06-01T09:00:00Z',
    external_policy_id: null,
    created_at: '2026-06-01T08:45:00Z',
    product: {
      id: `${id}-product`,
      name: productName,
      category,
      provider_name: providerName,
      provider_slug: providerName.toLowerCase().replace(/\s+/g, '-'),
    },
  };
}
