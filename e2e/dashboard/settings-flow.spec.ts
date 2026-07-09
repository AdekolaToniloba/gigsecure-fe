import {
  expect,
  test,
  type BrowserContext,
  type Page,
  type Route,
} from '@playwright/test';

const E2E_BASE_URL =
  process.env.E2E_BASE_URL ?? `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`;

const notificationPrefs = {
  risk_score_updates: true,
  premium_renewals: true,
  new_plan_recommendations: false,
  payment_confirmations: true,
  product_updates: false,
};

const privacySettings = {
  share_anonymised_data: true,
  personalise_recommendations: true,
  share_data_with_partners: false,
};

test('settings preferences save through documented payloads and remain mobile responsive', async ({
  page,
  context,
}) => {
  await openSettings(page, context);
  let notificationUpdate: unknown = null;
  let privacyUpdate: unknown = null;

  await page.route('**/api/v1/settings/notifications', async (route) => {
    if (await fulfillPreflight(route)) return;
    expect(route.request().headers().authorization).toBe('Bearer settings-e2e-token');
    if (route.request().method() === 'PUT') {
      notificationUpdate = await route.request().postDataJSON();
      await fulfillJson(route, { ...notificationPrefs, product_updates: true });
      return;
    }
    await fulfillJson(route, notificationPrefs);
  });

  await page.route('**/api/v1/settings/privacy', async (route) => {
    if (await fulfillPreflight(route)) return;
    expect(route.request().headers().authorization).toBe('Bearer settings-e2e-token');
    if (route.request().method() === 'PUT') {
      privacyUpdate = await route.request().postDataJSON();
      await fulfillJson(route, { ...privacySettings, share_data_with_partners: true });
      return;
    }
    await fulfillJson(route, privacySettings);
  });

  await page.goto('/dashboard/settings');
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('heading', { name: 'Email notifications' })).toBeVisible();

  await page.getByRole('switch', { name: 'GigSecure product updates' }).click();
  await expect.poll(() => notificationUpdate).toEqual({ product_updates: true });
  await expect(page.getByRole('switch', { name: 'GigSecure product updates' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  await page.getByRole('tab', { name: 'Privacy and Data' }).click();
  await expect(page.getByRole('heading', { name: 'Data & privacy controls' })).toBeVisible();
  await page.getByRole('switch', { name: 'Share data with insurance partners' }).click();
  await expect.poll(() => privacyUpdate).toEqual({ share_data_with_partners: true });

  for (const width of [320, 390, 768, 1024, 1512]) {
    await page.setViewportSize({ width, height: width >= 1024 ? 960 : 844 });
    await expect.poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('delete account requires password and exits the protected app on success', async ({
  page,
  context,
}) => {
  await openSettings(page, context);
  let deleteBody: unknown = null;

  await page.route('**/api/v1/settings/notifications', async (route) => {
    if (await fulfillPreflight(route)) return;
    await fulfillJson(route, notificationPrefs);
  });
  await page.route('**/api/v1/settings/account', async (route) => {
    if (await fulfillPreflight(route)) return;
    expect(route.request().method()).toBe('DELETE');
    expect(route.request().headers().authorization).toBe('Bearer settings-e2e-token');
    deleteBody = await route.request().postDataJSON();
    await route.fulfill({
      status: 204,
      headers: corsHeaders(route),
    });
  });

  await page.goto('/dashboard/settings');
  await page.getByRole('tab', { name: 'Delete account' }).click();
  await page.getByRole('button', { name: 'Delete account' }).click();

  const dialog = page.getByRole('dialog', { name: 'Delete account?' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Delete account' }).click();
  await expect(dialog.getByText('Enter your password to delete your account.')).toBeVisible();
  expect(deleteBody).toBeNull();

  await dialog.getByLabel('Password').fill('correct-password');
  await dialog.getByRole('button', { name: 'Delete account' }).click();

  await expect.poll(() => deleteBody).toEqual({ password: 'correct-password' });
  await expect(page).toHaveURL(/\/login\?account=deleted$/);
  await expect(page.getByRole('status')).toContainText('Your account has been deleted.');
});

test('deactivate account uses a confirmation dialog before redirecting to login', async ({
  page,
  context,
}) => {
  await openSettings(page, context);
  let deactivateRequests = 0;

  await page.route('**/api/v1/settings/notifications', async (route) => {
    if (await fulfillPreflight(route)) return;
    await fulfillJson(route, notificationPrefs);
  });
  await page.route('**/api/v1/settings/account/deactivate', async (route) => {
    if (await fulfillPreflight(route)) return;
    deactivateRequests += 1;
    expect(route.request().method()).toBe('POST');
    expect(route.request().headers().authorization).toBe('Bearer settings-e2e-token');
    await route.fulfill({
      status: 204,
      headers: corsHeaders(route),
    });
  });

  await page.goto('/dashboard/settings');
  await page.getByRole('tab', { name: 'Delete account' }).click();
  await page.getByRole('button', { name: 'Deactivate' }).click();

  const dialog = page.getByRole('dialog', { name: 'Deactivate account?' });
  await expect(dialog).toBeVisible();
  expect(deactivateRequests).toBe(0);
  await dialog.getByRole('button', { name: 'Deactivate' }).click();

  await expect(page).toHaveURL(/\/login\?account=deactivated$/);
  await expect(page.getByRole('status')).toContainText('Your account has been deactivated.');
  expect(deactivateRequests).toBe(1);
});

async function openSettings(page: Page, context: BrowserContext) {
  await seedRefreshCookie(context);
  await page.route('**/api/auth/refresh', (route) =>
    fulfillJson(route, {
      access_token: 'settings-e2e-token',
      token_type: 'bearer',
      kyc_verified: true,
      risk_assessed: true,
    }),
  );
}

async function seedRefreshCookie(context: BrowserContext) {
  await context.addCookies([{
    name: 'gs_refresh_token',
    value: 'settings-refresh-token',
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
