import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ActivateAccountForm from '@/components/auth/activate/activate-account-form';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

describe('ActivateAccountForm', () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
  });

  it('shows a clear error when the token is missing', () => {
    renderWithProviders(<ActivateAccountForm token={null} />);

    expect(screen.getByRole('heading', { name: /Activation link missing/i })).toBeInTheDocument();
    expect(screen.getByText(/Open the activation link from your email/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', '/login');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('validates password confirmation before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ActivateAccountForm token="activation-token-123" />);

    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'Different123');
    await user.click(screen.getByRole('button', { name: /Activate account/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('activates account, stores access token in memory, omits confirmation, and redirects', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/auth/activate', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          access_token: 'activated-access-token',
          token_type: 'bearer',
        });
      })
    );

    renderWithProviders(<ActivateAccountForm token="activation-token-123" />);

    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Activate account/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_PATH);
    });
    expect(submittedBody).toEqual({
      token: 'activation-token-123',
      password: 'SecurePass123',
    });
    expect(submittedBody).not.toHaveProperty('confirm_password');
    expect(useAuthStore.getState().accessToken).toBe('activated-access-token');
  });

  it('shows invalid or expired activation token errors accessibly', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/auth/activate', () =>
        HttpResponse.json({ detail: 'Invalid or expired activation token.' }, { status: 400 })
      )
    );

    renderWithProviders(<ActivateAccountForm token="expired-token" />);

    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Activate account/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired activation token.');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});
