import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckInboxPanel from '@/components/auth/check-inbox/check-inbox-panel';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/__tests__/test-utils';

describe('CheckInboxPanel', () => {
  it('renders check-inbox guidance and login link', () => {
    renderWithProviders(<CheckInboxPanel />);

    expect(screen.getByRole('heading', { name: /Check your inbox/i })).toBeInTheDocument();
    expect(screen.getByText(/We sent a verification link/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', '/login');
  });

  it('resends activation email with loading and success states', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/auth/resend-activation', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          message: 'If the email is registered, an activation link has been sent.',
        });
      })
    );
    renderWithProviders(<CheckInboxPanel />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.click(screen.getByRole('button', { name: /Resend activation email/i }));

    expect(await screen.findByText(/If the email is registered/i)).toBeInTheDocument();
    expect(submittedBody).toEqual({ email: 'amaka@example.com' });
  });

  it('shows resend errors accessibly', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/resend-activation', () =>
        HttpResponse.json({ detail: 'Please wait before requesting another email.' }, { status: 400 })
      )
    );
    renderWithProviders(<CheckInboxPanel />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.click(screen.getByRole('button', { name: /Resend activation email/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please wait before requesting another email.'
    );
  });
});
