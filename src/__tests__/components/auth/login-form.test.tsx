import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/login/login-form';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

describe('LoginForm', () => {
  beforeEach(() => {
    mockRouter.replace.mockReset();
  });

  it('validates required fields before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /Log in/i }));

    expect(await screen.findByText(/Invalid email/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password is required/i)).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('logs in, stores the access token in memory, and routes to dashboard by default', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;

    server.use(
      http.post('/api/auth/login', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json({
          access_token: 'login-access-token',
          token_type: 'bearer',
        });
      })
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/Password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(DEFAULT_AUTHENTICATED_PATH);
    });
    expect(submittedBody).toEqual({
      email: 'amaka@example.com',
      password: 'SecurePass123',
    });
    expect(useAuthStore.getState().accessToken).toBe('login-access-token');
  });

  it('routes to a provided safe redirect target after login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm redirectTo="/app/policies" />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/Password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/app/policies');
    });
  });

  it('shows invalid credential errors accessibly', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid email or password' }, { status: 401 })
      )
    );

    renderWithProviders(<LoginForm />);

    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/Password/i, { selector: 'input' }), 'WrongPass123');
    await user.click(screen.getByRole('button', { name: /Log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('renders signup link and keeps Google action as a non-submit control', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole('link', { name: /Sign up/i })).toHaveAttribute('href', '/register');
    expect(screen.getByRole('button', { name: /Sign In with Google/i })).toHaveAttribute(
      'type',
      'button'
    );
  });
});
