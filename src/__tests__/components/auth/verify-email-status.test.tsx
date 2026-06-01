import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import VerifyEmailStatus from '@/components/auth/verify-email/verify-email-status';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

describe('VerifyEmailStatus', () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
  });

  it('shows a clear error when the token is missing', () => {
    renderWithProviders(<VerifyEmailStatus token={null} />);

    expect(
      screen.getByRole('heading', { name: /Verification link missing/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Open the verification link from your email/i)).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('verifies a valid token once, stores the access token, and redirects', async () => {
    let requestCount = 0;
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/auth/verify-email', async ({ request }) => {
        requestCount += 1;
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          access_token: 'verified-access-token',
          token_type: 'bearer',
        });
      })
    );

    renderWithProviders(<VerifyEmailStatus token="email-token-123" />);

    expect(
      screen.getByRole('heading', { name: /Verifying email/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_PATH);
    });

    expect(requestCount).toBe(1);
    expect(submittedBody).toEqual({ token: 'email-token-123' });
    expect(useAuthStore.getState().accessToken).toBe('verified-access-token');
  });

  it('shows an accessible API error for invalid or expired tokens', async () => {
    server.use(
      http.post('/api/auth/verify-email', () =>
        HttpResponse.json(
          { detail: 'Invalid or expired verification token.' },
          { status: 400 }
        )
      )
    );

    renderWithProviders(<VerifyEmailStatus token="expired-token" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid or expired verification token.'
    );
    expect(
      screen.getByRole('heading', { name: /Email verification failed/i })
    ).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
