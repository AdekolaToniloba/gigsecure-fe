import React from 'react';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';
import { SettingsPageController } from '@/components/dashboard/settings/settings-page-controller';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  notificationPrefsFixture,
} from '@/mocks/fixtures/settings';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const NOTIFICATIONS_URL = `${BASE}${ENDPOINTS.SETTINGS.NOTIFICATIONS}`;
const PRIVACY_URL = `${BASE}${ENDPOINTS.SETTINGS.PRIVACY}`;
const ACCOUNT_DEACTIVATE_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT_DEACTIVATE}`;
const ACCOUNT_URL = `${BASE}${ENDPOINTS.SETTINGS.ACCOUNT}`;

function setSession() {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'settings-ui-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
}

beforeEach(() => {
  setSession();
  mockRouter.replace.mockReset();
  document.body.style.overflow = '';
});

describe('SettingsPageController', () => {
  it('renders notification settings with loading and success switch states', async () => {
    server.use(
      http.get(NOTIFICATIONS_URL, async () => {
        await delay(80);
        return HttpResponse.json(notificationPrefsFixture);
      }),
    );

    renderWithProviders(<SettingsPageController />);

    expect(screen.getByRole('tab', { name: 'Notifications' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('status', { name: 'Loading Email notifications' })).toBeVisible();
    const riskUpdates = await screen.findByRole('switch', { name: 'Risk score updates' });
    expect(riskUpdates).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(screen.getByRole('switch', { name: 'New plan recommendations' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('supports keyboard tab navigation and lazy-loads privacy settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPageController />);

    const notificationsTab = screen.getByRole('tab', { name: 'Notifications' });
    notificationsTab.focus();
    await user.keyboard('{ArrowRight}');

    const privacyTab = screen.getByRole('tab', { name: 'Privacy and Data' });
    await waitFor(() => expect(privacyTab).toHaveFocus());
    expect(privacyTab).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('heading', { name: 'Data & privacy controls' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Data usage' })).toBeVisible();
    expect(screen.getByRole('switch', {
      name: 'Share data with insurance partners',
    })).toHaveAttribute('aria-checked', 'false');

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Delete account' })).toHaveFocus();
    expect(screen.getByRole('heading', { name: 'Danger zone' })).toBeVisible();
  });

  it('shows query errors and retries from the keyboard', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(NOTIFICATIONS_URL, () => {
        requests += 1;
        if (requests === 1) {
          return HttpResponse.json(
            { detail: 'Notification settings are unavailable.' },
            { status: 400 },
          );
        }
        return HttpResponse.json(notificationPrefsFixture);
      }),
    );

    renderWithProviders(<SettingsPageController />);

    const retry = await screen.findByRole('button', { name: 'Try again' });
    expect(screen.getByRole('alert')).toHaveTextContent('Notification settings are unavailable.');
    retry.focus();
    expect(retry).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('switch', { name: 'Risk score updates' })).toBeVisible();
    expect(requests).toBe(2);
  });

  it('persists notification toggles with a partial update payload', async () => {
    const user = userEvent.setup();
    let submittedBody: unknown = null;
    server.use(
      http.put(NOTIFICATIONS_URL, async ({ request }) => {
        submittedBody = await request.json();
        return HttpResponse.json({ ...notificationPrefsFixture, product_updates: true });
      }),
    );

    renderWithProviders(<SettingsPageController />);

    const productUpdates = await screen.findByRole('switch', {
      name: 'GigSecure product updates',
    });
    expect(productUpdates).toHaveAttribute('aria-checked', 'false');
    await user.click(productUpdates);

    await waitFor(() => expect(submittedBody).toEqual({ product_updates: true }));
    expect(productUpdates).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('GigSecure product updates enabled.');
  });

  it('rolls back failed privacy toggle saves and exposes the parsed error', async () => {
    const user = userEvent.setup();
    server.use(
      http.put(PRIVACY_URL, () =>
        HttpResponse.json({ detail: 'Privacy preference could not be saved.' }, { status: 422 })),
    );

    renderWithProviders(<SettingsPageController />);
    await user.click(screen.getByRole('tab', { name: 'Privacy and Data' }));
    const partners = await screen.findByRole('switch', {
      name: 'Share data with insurance partners',
    });

    await user.click(partners);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Privacy preference could not be saved.',
    );
    expect(partners).toHaveAttribute('aria-checked', 'false');
  });

  it('requires confirmation before deactivation and redirects after session cleanup', async () => {
    const user = userEvent.setup();
    let deactivateRequests = 0;
    server.use(
      http.post(ACCOUNT_DEACTIVATE_URL, () => {
        deactivateRequests += 1;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<SettingsPageController />);
    await user.click(screen.getByRole('tab', { name: 'Delete account' }));
    await user.click(screen.getByRole('button', { name: 'Deactivate' }));

    const dialog = screen.getByRole('dialog', { name: 'Deactivate account?' });
    expect(within(dialog).getByRole('button', {
      name: 'Close account confirmation dialog',
    })).toHaveFocus();
    expect(deactivateRequests).toBe(0);

    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login?account=deactivated');
    });
    expect(deactivateRequests).toBe(1);
    await waitFor(() => {
      expect(useAuthStore.getState().hasFullSession).toBe(false);
    });
  });

  it('validates delete password, handles API errors, and submits the documented body', async () => {
    const user = userEvent.setup();
    let submittedBody: unknown = null;
    let requests = 0;
    server.use(
      http.delete(ACCOUNT_URL, async ({ request }) => {
        requests += 1;
        submittedBody = await request.json();
        if (requests === 1) {
          return HttpResponse.json({ detail: 'Password is incorrect.' }, { status: 422 });
        }
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<SettingsPageController />);
    await user.click(screen.getByRole('tab', { name: 'Delete account' }));
    const opener = screen.getByRole('button', { name: 'Delete account' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Delete account?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));
    expect(await within(dialog).findByText('Enter your password to delete your account.'))
      .toBeVisible();
    expect(requests).toBe(0);

    await user.type(within(dialog).getByLabelText('Password'), 'wrong-password');
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Password is incorrect.');
    expect(submittedBody).toEqual({ password: 'wrong-password' });

    await user.clear(within(dialog).getByLabelText('Password'));
    await user.type(within(dialog).getByLabelText('Password'), 'correct-password');
    await user.click(within(dialog).getByRole('button', { name: 'Delete account' }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login?account=deleted');
    });
    expect(submittedBody).toEqual({ password: 'correct-password' });
  });

  it('traps modal focus, closes accessibly, and keeps mobile layouts fluid', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPageController />);
    await user.click(screen.getByRole('tab', { name: 'Delete account' }));
    const opener = screen.getByRole('button', { name: 'Deactivate' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Deactivate account?' });
    const close = within(dialog).getByRole('button', { name: 'Close account confirmation dialog' });
    const confirm = within(dialog).getByRole('button', { name: 'Deactivate' });
    expect(document.body.style.overflow).toBe('hidden');

    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(opener).toHaveFocus();

    expect(screen.getByRole('tablist', { name: 'Settings sections' })).toHaveClass('overflow-x-auto');
    expect(screen.getByRole('button', { name: 'Deactivate' })).toHaveClass('w-full', 'sm:w-auto');
  });
});
