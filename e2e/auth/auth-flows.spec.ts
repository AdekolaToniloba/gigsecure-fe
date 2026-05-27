import { expect, test, type BrowserContext, type Page, type Route } from '@playwright/test';

const REFRESH_COOKIE = {
  name: 'gs_refresh_token',
  value: 'refresh-token',
  domain: '127.0.0.1',
  path: '/',
  httpOnly: true,
  sameSite: 'Strict' as const,
};

test.beforeEach(async ({ page }) => {
  await mockUnauthenticatedRefresh(page);
});

test('register routes to check inbox without creating a browser-readable session', async ({ page }) => {
  await page.route('**/api/auth/register', async (route) => {
    expect(route.request().headers()['x-requested-with']).toBe('XMLHttpRequest');
    const payload = route.request().postDataJSON();
    expect(payload).toMatchObject({
      email: 'amaka@example.com',
      first_name: 'Amaka',
      last_name: 'Obi',
      password: 'SecurePass123',
    });
    expect(payload).not.toHaveProperty('confirm_password');

    await fulfillJson(route, {
      message: 'Registration successful. Please check your email to verify your account.',
    }, 201);
  });

  await page.goto('/register');
  await page.getByLabel('First name').fill('Amaka');
  await page.getByLabel('Last name').fill('Obi');
  await page.getByLabel('Email').fill('amaka@example.com');
  await page.locator('input[name="password"]').fill('SecurePass123');
  await page.getByLabel('Confirm password').fill('SecurePass123');
  await page.getByRole('button', { name: 'Get Started' }).click();

  await expect(page).toHaveURL(/\/check-inbox$/);
  await expect(page.getByRole('heading', { name: /check your inbox/i })).toBeVisible();
  await expectNoBrowserReadableTokens(page);
});

test('login success creates an in-memory session and reaches dashboard', async ({ page }) => {
  await mockLoginSuccess(page);

  await page.goto('/login');
  await page.getByLabel('Email').fill('amaka@example.com');
  await page.locator('input[name="password"]').fill('SecurePass123');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expectNoBrowserReadableTokens(page);
});

test('login error shows a user-visible message and stays on login', async ({ page }) => {
  await page.route('**/api/auth/login', async (route) => {
    await fulfillJson(route, { detail: 'Invalid credentials' }, 401);
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('amaka@example.com');
  await page.locator('input[name="password"]').fill('wrong-password');
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator('#login-form-error')).toContainText('Invalid credentials');
});

test('forgot password shows the generic email-sent state', async ({ page }) => {
  await page.route('**/api/auth/forgot-password', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ email: 'amaka@example.com' });
    await fulfillJson(route, { message: 'If the email exists, a reset link has been sent.' });
  });

  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('amaka@example.com');
  await page.getByRole('button', { name: 'Submit' }).click();

  await expect(page.getByRole('heading', { name: 'Email sent' })).toBeVisible();
  await expect(page.getByText(/password reset link/i)).toBeVisible();
});

test('reset password uses the token, omits confirmation, and returns to login with success', async ({ page }) => {
  await page.route('**/api/auth/reset-password', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload).toEqual({
      token: 'reset-token',
      new_password: 'NewPass123',
    });
    expect(payload).not.toHaveProperty('confirm_password');
    await fulfillJson(route, { message: 'Password reset successful.' });
  });

  await page.goto('/reset-password?token=reset-token');
  await page.getByLabel('New password').fill('NewPass123');
  await page.getByLabel('Confirm password').fill('NewPass123');
  await page.getByRole('button', { name: 'Reset password' }).click();

  await expect(page).toHaveURL(/\/login\?reset=success$/);
  await expect(page.getByRole('status')).toContainText('Your password has been reset');
});

test('activate account stores only the browser-safe access token and reaches dashboard', async ({ page }) => {
  await page.route('**/api/auth/activate', async (route) => {
    const payload = route.request().postDataJSON();
    expect(payload).toEqual({
      token: 'activate-token',
      password: 'SecurePass123',
    });
    expect(payload).not.toHaveProperty('confirm_password');
    await fulfillJson(
      route,
      { access_token: 'activated-access-token', token_type: 'bearer' },
      200,
      withRefreshCookie()
    );
  });

  await page.goto('/activate?token=activate-token');
  await page.locator('input[name="password"]').fill('SecurePass123');
  await page.getByLabel('Confirm password').fill('SecurePass123');
  await page.getByRole('button', { name: 'Activate account' }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expectNoBrowserReadableTokens(page);
});

test('verify email consumes a token and reaches dashboard', async ({ page }) => {
  await page.route('**/api/auth/verify-email', async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token: 'verify-token' });
    await fulfillJson(
      route,
      { access_token: 'verified-access-token', token_type: 'bearer' },
      200,
      withRefreshCookie()
    );
  });

  await page.goto('/verify-email?token=verify-token');

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expectNoBrowserReadableTokens(page);
});

test('silent refresh restores protected pages from the httpOnly cookie', async ({ page, context }) => {
  await seedRefreshCookie(context);

  let refreshCount = 0;
  await page.route('**/api/auth/refresh', async (route) => {
    refreshCount += 1;
    expect(route.request().headers()['x-requested-with']).toBe('XMLHttpRequest');
    await fulfillJson(route, { access_token: 'silent-refresh-token', token_type: 'bearer' });
  });

  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect.poll(() => refreshCount).toBeGreaterThan(0);
  await expectNoBrowserReadableTokens(page);
});

test('authenticated change password keeps the session and omits confirmation', async ({ page, context }) => {
  await seedRefreshCookie(context);
  await page.route('**/api/auth/refresh', async (route) => {
    await fulfillJson(route, { access_token: 'session-access-token', token_type: 'bearer' });
  });
  await page.route('**/api/auth/change-password', async (route) => {
    expect(route.request().method()).toBe('PUT');
    expect(route.request().headers().authorization).toBe('Bearer session-access-token');
    expect(route.request().postDataJSON()).toEqual({
      old_password: 'OldPass123',
      new_password: 'NewPass123',
    });
    await fulfillJson(route, { message: 'Password changed successfully.' });
  });

  await page.goto('/change-password');
  await page.getByLabel('Current password').fill('OldPass123');
  await page.getByLabel('New password').fill('NewPass123');
  await page.getByLabel('Confirm password').fill('NewPass123');
  await page.getByRole('button', { name: 'Change password' }).click();

  await expect(page.getByRole('status')).toContainText('Your password has been changed successfully.');
  await expectNoBrowserReadableTokens(page);
});

async function mockUnauthenticatedRefresh(page: Page) {
  await page.route('**/api/auth/refresh', async (route) => {
    await fulfillJson(route, { detail: 'No refresh token' }, 401);
  });
}

async function mockLoginSuccess(page: Page) {
  await page.route('**/api/auth/login', async (route) => {
    expect(route.request().headers()['x-requested-with']).toBe('XMLHttpRequest');
    expect(route.request().postDataJSON()).toEqual({
      email: 'amaka@example.com',
      password: 'SecurePass123',
    });
    await fulfillJson(
      route,
      { access_token: 'login-access-token', token_type: 'bearer' },
      200,
      withRefreshCookie()
    );
  });
}

async function seedRefreshCookie(context: BrowserContext) {
  await context.addCookies([REFRESH_COOKIE]);
}

function withRefreshCookie() {
  return {
    'Set-Cookie': 'gs_refresh_token=refresh-token; Path=/; HttpOnly; SameSite=Strict',
  };
}

async function fulfillJson(
  route: Route,
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers,
    body: JSON.stringify(body),
  });
}

async function expectNoBrowserReadableTokens(page: Page) {
  await expect
    .poll(() => page.evaluate(() => Object.keys(localStorage).join('\n')))
    .not.toContain('token');
  await expect.poll(() => page.evaluate(() => document.cookie)).not.toContain('gs_refresh_token');
}
