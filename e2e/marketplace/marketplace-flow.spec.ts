import { expect, test, type Page, type Route } from '@playwright/test';

type ProductFixture = {
  id: string;
  name: string;
  category: string;
  description: string;
  premium_amount: string;
  premium_currency: string;
  coverage_amount: string;
  renewal_frequency: string;
  risk_level: string;
  is_active: boolean;
  provider: {
    id: string;
    slug: string;
    name: string;
    logo_url: string | null;
  };
};

const PRODUCT_LIST_RE = /\/api\/v1\/marketplace\/products(?:\?.*)?$/;
const PRODUCT_DETAIL_RE = /\/api\/v1\/marketplace\/products\/[^/?]+(?:\?.*)?$/;
const RECOMMENDATIONS_RE = /\/api\/v1\/marketplace\/recommendations(?:\?.*)?$/;

const products: ProductFixture[] = [
  productFixture({
    id: 'prod-income',
    name: 'Income Shield for Gig Workers',
    category: 'Income Protection',
    providerSlug: 'axa-mansard',
    providerName: 'AXA Mansard',
    premium: '9500',
    coverage: '130000',
    riskLevel: 'low',
  }),
  productFixture({
    id: 'prod-equipment',
    name: 'Equipment Protection Plus',
    category: 'Equipment Protection',
    providerSlug: 'leadway',
    providerName: 'Leadway Assurance',
    premium: '6200',
    coverage: '250000',
    riskLevel: 'moderate',
  }),
  productFixture({
    id: 'prod-liability',
    name: 'Freelancer Liability Cover',
    category: 'Liability Protection',
    providerSlug: 'coronation',
    providerName: 'Coronation Insurance',
    premium: '7800',
    coverage: '180000',
    riskLevel: 'high',
  }),
  productFixture({
    id: 'prod-health',
    name: 'Flexible Health Support',
    category: 'Health Protection',
    providerSlug: 'zurich',
    providerName: 'Zurich Nigeria',
    premium: '4300',
    coverage: '90000',
    riskLevel: 'low',
  }),
  productFixture({
    id: 'prod-income-plus',
    name: 'Income Shield Plus',
    category: 'Income Protection',
    providerSlug: 'leadway',
    providerName: 'Leadway Assurance',
    premium: '12500',
    coverage: '300000',
    riskLevel: 'moderate',
  }),
];

test.describe('public marketplace flow', () => {
  test('anonymous users can browse, filter, search, and open public product details', async ({ page }) => {
    const seenProductRequests: string[] = [];
    const publicRequestHeaders: Array<string | undefined> = [];
    await mockAnonymousRefresh(page);
    await mockMarketplaceApi(page, {
      onProductRequest: (url, authorization) => {
        seenProductRequests.push(url);
        publicRequestHeaders.push(authorization);
      },
    });

    await page.goto('/marketplace');

    await expect(page.getByRole('heading', { name: 'GigSecure Marketplace' })).toBeAttached();
    await expect(page.getByRole('button', { name: /Open details for Income Shield for Gig Workers/i })).toBeVisible();

    await page.getByRole('button', { name: 'Low Risk' }).click();
    await expect(page).toHaveURL(/risk_level=low/);
    await expect(page.getByRole('button', { name: /Open details for Flexible Health Support/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open details for Equipment Protection Plus/i })).toBeHidden();

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await expect(page).not.toHaveURL(/risk_level=/);

    await page.getByLabel('Search marketplace plans').fill('equipment');
    await expect(page).toHaveURL(/q=equipment/);
    await expect(page.getByRole('button', { name: /Open details for Equipment Protection Plus/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open details for Income Shield for Gig Workers/i })).toBeHidden();

    await page.getByRole('button', { name: /Explore Plan/i }).first().click();
    const panel = page.getByRole('dialog', { name: 'Equipment Protection Plus' });
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Company: Leadway Assurance')).toBeVisible();
    await expect(panel.getByText('Coverage Limit')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();

    expect(seenProductRequests.some((url) => url.includes('risk_level=low'))).toBe(true);
    expect(seenProductRequests.some((url) => url.includes('q=equipment'))).toBe(true);
    expect(publicRequestHeaders.every((authorization) => authorization === undefined)).toBe(true);
  });

  test('desktop sidebar applies pending filters only after Apply Filters', async ({ page }) => {
    await mockAnonymousRefresh(page);
    await mockMarketplaceApi(page);

    await page.goto('/marketplace');
    await expect(page.getByRole('button', { name: /Open details for Income Shield for Gig Workers/i })).toBeVisible();

    await page.getByRole('checkbox', { name: 'Income Protection' }).check();
    await page.getByRole('checkbox', { name: 'Leadway Assurance' }).check();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page).not.toHaveURL(/provider_slug=/);

    await page.getByRole('button', { name: 'Apply Filters' }).click();
    await expect(page).toHaveURL(/category=Income\+Protection/);
    await expect(page).toHaveURL(/provider_slug=leadway/);
    await expect(page.getByRole('button', { name: /Open details for Income Shield Plus/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open details for Income Shield for Gig Workers/i })).toBeHidden();

    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page).not.toHaveURL(/category=/);
    await expect(page.getByRole('button', { name: /Open details for Income Shield for Gig Workers/i })).toBeVisible();
  });

  test('mobile shows a search-first navbar and applies filters from the bottom sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockAnonymousRefresh(page);
    await mockMarketplaceApi(page);

    await page.goto('/marketplace');

    await expect(page.getByLabel('Search marketplace plans')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Notifications coming soon' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Filters +' })).toBeVisible();

    await page.getByRole('button', { name: 'Filters +' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'All', exact: true })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Low Risk' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Moderate Risk' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'High Risk' })).toBeVisible();

    await sheet.getByRole('button', { name: 'High Risk' }).focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/risk_level=high/);
    await sheet.getByRole('checkbox', { name: 'Liability Protection' }).check();
    await sheet.getByRole('button', { name: 'Apply Filters' }).click();

    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/category=Liability\+Protection/);
    await expect(page.getByRole('button', { name: 'Filters(2)' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Open details for Freelancer Liability Cover/i })).toBeVisible();
  });

  test('recommendations send anonymous users to login and unassessed users to assessment', async ({ page }) => {
    await mockAnonymousRefresh(page);
    await mockMarketplaceApi(page);

    await page.goto('/marketplace');
    const recommendationsButton = page.getByRole('button', { name: 'View Recommendations' });
    await expect(recommendationsButton).toBeEnabled();
    await recommendationsButton.click();
    await expect(page).toHaveURL(/\/login\?redirect=%2Fmarketplace$/);

    await page.goto('/marketplace');
    await mockRefresh(page, { riskAssessed: false });
    await page.reload();
    await expect(recommendationsButton).toBeEnabled();
    await recommendationsButton.click();
    await expect(page).toHaveURL(/\/assessment$/);
  });

  test('assessed authenticated users can load personalized recommendations', async ({ page }) => {
    let recommendationAuthorization: string | undefined;
    await mockRefresh(page, { riskAssessed: true });
    await mockMarketplaceApi(page, {
      onRecommendationRequest: (authorization) => {
        recommendationAuthorization = authorization;
      },
    });

    await page.goto('/marketplace');
    const recommendationsButton = page.getByRole('button', { name: 'View Recommendations' });
    await expect(recommendationsButton).toBeEnabled();
    await recommendationsButton.click();

    await expect(page.getByRole('status').filter({ hasText: '3 personalized plans are ready.' })).toBeVisible();
    expect(recommendationAuthorization).toBe('Bearer e2e-access-token');
  });
});

function productFixture({
  id,
  name,
  category,
  providerSlug,
  providerName,
  premium,
  coverage,
  riskLevel,
}: {
  id: string;
  name: string;
  category: string;
  providerSlug: string;
  providerName: string;
  premium: string;
  coverage: string;
  riskLevel: string;
}): ProductFixture {
  return {
    id,
    name,
    category,
    description: `${category} that provides financial support when unexpected events interrupt your work.`,
    premium_amount: premium,
    premium_currency: 'NGN',
    coverage_amount: coverage,
    renewal_frequency: 'monthly',
    risk_level: riskLevel,
    is_active: true,
    provider: {
      id: `provider-${providerSlug}`,
      slug: providerSlug,
      name: providerName,
      logo_url: null,
    },
  };
}

async function mockAnonymousRefresh(page: Page) {
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, { message: 'No refresh token' }, 401)
  );
}

async function mockRefresh(page: Page, flags: { riskAssessed: boolean }) {
  await page.unroute('**/api/auth/refresh').catch(() => undefined);
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, {
      access_token: 'e2e-access-token',
      refresh_token: 'refresh-cookie-only',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: flags.riskAssessed,
    })
  );
}

async function mockMarketplaceApi(
  page: Page,
  callbacks: {
    onProductRequest?: (url: string, authorization: string | undefined) => void;
    onRecommendationRequest?: (authorization: string | undefined) => void;
  } = {}
) {
  await page.route(PRODUCT_DETAIL_RE, (route) => {
    callbacks.onProductRequest?.(
      route.request().url(),
      route.request().headers().authorization
    );
    const url = new URL(route.request().url());
    const productId = url.pathname.split('/').at(-1);
    const product = products.find((item) => item.id === productId);
    return product
      ? fulfillJson(route, product)
      : fulfillJson(route, { detail: 'Product not found' }, 404);
  });

  await page.route(PRODUCT_LIST_RE, (route) => {
    callbacks.onProductRequest?.(
      route.request().url(),
      route.request().headers().authorization
    );
    const url = new URL(route.request().url());
    const filtered = filterProducts(url.searchParams);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    return fulfillJson(route, {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    });
  });

  await page.route(RECOMMENDATIONS_RE, (route) => {
    callbacks.onRecommendationRequest?.(route.request().headers().authorization);
    return fulfillJson(route, {
      recommended_categories: ['Income Protection', 'Equipment Protection'],
      items: products.slice(0, 3),
    });
  });
}

function filterProducts(searchParams: URLSearchParams) {
  const query = searchParams.get('q')?.trim().toLowerCase();
  const minPremium = Number(searchParams.get('min_premium') ?? 0);
  const maxPremium = Number(searchParams.get('max_premium') ?? Number.MAX_SAFE_INTEGER);

  return products.filter((product) => (
    matchesRepeated(searchParams, 'category', product.category) &&
    matchesRepeated(searchParams, 'provider_slug', product.provider.slug) &&
    matchesRepeated(searchParams, 'risk_level', product.risk_level) &&
    (!query || product.name.toLowerCase().includes(query)) &&
    Number(product.premium_amount) >= minPremium &&
    Number(product.premium_amount) <= maxPremium
  ));
}

function matchesRepeated(searchParams: URLSearchParams, key: string, value: string) {
  const selected = searchParams.getAll(key);
  return selected.length === 0 || selected.includes(value);
}

async function fulfillJson(route: Route, body: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}
