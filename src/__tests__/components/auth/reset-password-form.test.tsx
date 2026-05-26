import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordForm from '@/components/auth/reset-password/reset-password-form';
import LoginForm from '@/components/auth/login/login-form';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
  });

  it('shows a clear error when the token is missing', () => {
    renderWithProviders(<ResetPasswordForm token={null} />);

    expect(screen.getByRole('heading', { name: /Reset link missing/i })).toBeInTheDocument();
    expect(screen.getByText(/Open the password reset link from your email/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Request password reset/i })).toHaveAttribute(
      'href',
      '/forgot-password'
    );
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('validates password confirmation before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ResetPasswordForm token="reset-token-123" />);

    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'Different123');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('submits token and new password, omits confirmation, and redirects to login success state', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/auth/reset-password', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ message: 'Password reset successful' });
      })
    );

    renderWithProviders(<ResetPasswordForm token="reset-token-123" />);

    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login?reset=success');
    });
    expect(submittedBody).toEqual({
      token: 'reset-token-123',
      new_password: 'SecurePass123',
    });
    expect(submittedBody).not.toHaveProperty('confirm_password');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('shows API errors accessibly', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/auth/reset-password', () =>
        HttpResponse.json({ detail: 'Invalid or expired reset token.' }, { status: 400 })
      )
    );

    renderWithProviders(<ResetPasswordForm token="expired-token" />);

    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Reset password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid or expired reset token.');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('renders the post-reset login success message', () => {
    renderWithProviders(
      <LoginForm successMessage="Your password has been reset. Log in with your new password." />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Your password has been reset.');
  });
});
