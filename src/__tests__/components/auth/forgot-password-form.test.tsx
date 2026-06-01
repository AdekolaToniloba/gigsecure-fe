import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '@/components/auth/forgot-password/forgot-password-form';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/__tests__/test-utils';

describe('ForgotPasswordForm', () => {
  it('validates email before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.click(screen.getByRole('button', { name: /Submit/i }));

    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument();
  });

  it('submits the reset request and shows a generic success state', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/auth/forgot-password', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ message: 'Reset email sent' });
      })
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    expect(await screen.findByRole('heading', { name: /Email sent/i })).toBeInTheDocument();
    expect(screen.getByText(/We've sent a password reset link/i)).toBeInTheDocument();
    expect(submittedBody).toEqual({ email: 'amaka@example.com' });
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('shows API errors accessibly', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/auth/forgot-password', () =>
        HttpResponse.json({ detail: 'Please wait before requesting another reset link.' }, { status: 400 })
      )
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.click(screen.getByRole('button', { name: /Submit/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please wait before requesting another reset link.'
    );
    expect(screen.queryByRole('heading', { name: /Email sent/i })).not.toBeInTheDocument();
  });
});
