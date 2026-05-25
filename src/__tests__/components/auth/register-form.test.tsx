import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '@/components/auth/register/register-form';
import { server } from '@/mocks/server';
import { renderWithProviders, mockRouter } from '@/__tests__/test-utils';
import { useAuthStore } from '@/store/auth-store';

describe('RegisterForm', () => {
  beforeEach(() => {
    mockRouter.push.mockClear();
  });

  it('validates password confirmation before submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/First name/i), 'Amaka');
    await user.type(screen.getByLabelText(/Last name/i), 'Obi');
    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'Different123');
    await user.click(screen.getByRole('button', { name: /Get Started/i }));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('submits registration without confirm_password, routes to check inbox, and does not create a session', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        return HttpResponse.json(
          {
            message:
              'Registration successful. Please check your email to verify your account.',
          },
          { status: 201 }
        );
      })
    );
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/First name/i), 'Amaka');
    await user.type(screen.getByLabelText(/Last name/i), 'Obi');
    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Get Started/i }));

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/check-inbox');
    });
    expect(submittedBody).toEqual({
      email: 'amaka@example.com',
      password: 'SecurePass123',
      first_name: 'Amaka',
      last_name: 'Obi',
    });
    expect(submittedBody).not.toHaveProperty('confirm_password');
    expect(useAuthStore.getState().accessToken).toBeNull();
  });

  it('shows API errors accessibly', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ detail: 'Email already registered' }, { status: 400 })
      )
    );
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText(/First name/i), 'Amaka');
    await user.type(screen.getByLabelText(/Email/i), 'amaka@example.com');
    await user.type(screen.getByLabelText(/^Password/i, { selector: 'input' }), 'SecurePass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'SecurePass123');
    await user.click(screen.getByRole('button', { name: /Get Started/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email already registered');
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('renders the login link and google action as non-submit controls', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('button', { name: /Sign Up with Google/i })).toHaveAttribute(
      'type',
      'button'
    );
  });
});
