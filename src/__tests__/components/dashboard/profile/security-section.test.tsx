import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse, delay } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { KycStatusRow } from '@/components/dashboard/profile/kyc-status-row';
import { SecuritySection } from '@/components/dashboard/profile/security-section';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const KYC_STATUS_URL = `${BASE}${ENDPOINTS.KYC.STATUS}`;

function renderWithQueryClient(
  ui: React.ReactElement,
  queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  }),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  act(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setSession({
      accessToken: 'security-token',
      kycVerified: false,
      riskAssessed: true,
    });
  });
});

describe('SecuritySection', () => {
  it('opens and closes the password modal accessibly and restores focus', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SecuritySection />);

    const changeButton = screen.getByRole('button', { name: 'Change' });
    await user.click(changeButton);

    const dialog = screen.getByRole('dialog', { name: 'Change password' });
    const closeButton = within(dialog).getByRole('button', { name: 'Close password dialog' });
    expect(closeButton).toHaveFocus();

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(within(dialog).getByRole('button', { name: 'Update password' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Change password' })).not.toBeInTheDocument();
    expect(changeButton).toHaveFocus();
  });

  it('validates password fields before submitting', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<SecuritySection />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByText('Current password is required')).toBeInTheDocument();
    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument();
    expect(await screen.findByText('Please confirm your password')).toBeInTheDocument();
  });

  it('submits only old and new passwords, keeps the user authenticated, and announces success', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;
    let authorizationHeader: string | null = null;

    server.use(
      http.put('/api/auth/change-password', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        authorizationHeader = request.headers.get('Authorization');
        return HttpResponse.json({ message: 'Password changed successfully' });
      }),
    );

    renderWithQueryClient(<SecuritySection />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.type(screen.getByLabelText(/Current password/i, { selector: 'input' }), 'OldPass123');
    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'NewPass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'NewPass123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => {
      expect(screen.getByText('Your password was updated successfully.')).toBeInTheDocument();
    });
    expect(screen.queryByRole('dialog', { name: 'Change password' })).not.toBeInTheDocument();
    expect(submittedBody).toEqual({
      old_password: 'OldPass123',
      new_password: 'NewPass123',
    });
    expect(submittedBody).not.toHaveProperty('confirm_password');
    expect(authorizationHeader).toBe('Bearer security-token');
    expect(useAuthStore.getState().accessToken).toBe('security-token');
  });

  it('shows password API errors accessibly without clearing the active session', async () => {
    const user = userEvent.setup();

    server.use(
      http.put('/api/auth/change-password', () =>
        HttpResponse.json({ detail: 'Current password is incorrect.' }, { status: 400 }),
      ),
    );

    renderWithQueryClient(<SecuritySection />);

    await user.click(screen.getByRole('button', { name: 'Change' }));
    await user.type(screen.getByLabelText(/Current password/i, { selector: 'input' }), 'WrongPass123');
    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'NewPass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'NewPass123');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
    expect(useAuthStore.getState().accessToken).toBe('security-token');
  });
});

describe('KycStatusRow', () => {
  it.each([
    {
      label: 'verified',
      body: {
        status: 'verified',
        document_type: 'NIN',
        verified_at: '2026-04-24T10:00:00Z',
        rejection_reason: null,
      },
      statusText: 'Verified',
      actionLabel: 'View details',
    },
    {
      label: 'pending',
      body: {
        status: 'pending',
        document_type: 'NIN',
        verified_at: null,
        rejection_reason: null,
      },
      statusText: 'Pending',
      actionLabel: 'Review',
    },
    {
      label: 'rejected',
      body: {
        status: 'rejected',
        document_type: 'NIN',
        verified_at: null,
        rejection_reason: 'Submitted details did not match identity records.',
      },
      statusText: 'Needs attention',
      actionLabel: 'Retry',
    },
    {
      label: 'failed',
      body: {
        status: 'failed',
        document_type: 'NIN',
        verified_at: null,
        rejection_reason: 'Verification could not be completed due to a technical issue.',
      },
      statusText: 'Unavailable',
      actionLabel: 'Retry',
    },
    {
      label: 'not-started',
      body: {
        status: null,
        document_type: null,
        verified_at: null,
        rejection_reason: null,
      },
      statusText: 'Not started',
      actionLabel: 'Verify',
    },
  ])('renders %s KYC state with the right CTA', async ({ body, statusText, actionLabel }) => {
    server.use(http.get(KYC_STATUS_URL, () => HttpResponse.json(body)));

    renderWithQueryClient(<KycStatusRow />);

    expect(await screen.findByText(statusText)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: actionLabel })).toHaveAttribute('href', '/kyc');
  });

  it('shows a loading state while KYC status is being fetched', () => {
    server.use(
      http.get(KYC_STATUS_URL, async () => {
        await delay(150);
        return HttpResponse.json({
          status: null,
          document_type: null,
          verified_at: null,
          rejection_reason: null,
        });
      }),
    );

    renderWithQueryClient(<KycStatusRow />);

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('retries after a KYC status error and recovers in place', async () => {
    const user = userEvent.setup();
    let requestCount = 0;

    server.use(
      http.get(KYC_STATUS_URL, () => {
        requestCount += 1;
        return requestCount === 1
          ? HttpResponse.json({ detail: 'Unable to load verification status.' }, { status: 400 })
          : HttpResponse.json({
            status: 'verified',
            document_type: 'NIN',
            verified_at: '2026-04-24T10:00:00Z',
            rejection_reason: null,
          });
      }),
    );

    renderWithQueryClient(<KycStatusRow />);

    expect(await screen.findByRole('button', { name: 'Retry' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => {
      expect(screen.getByText('Verified')).toBeInTheDocument();
    });
    expect(requestCount).toBe(2);
  });
});
