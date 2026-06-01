import { http, HttpResponse } from 'msw';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChangePasswordForm from '@/components/auth/change-password/change-password-form';
import { ProtectedRoute } from '@/components/auth/shared/protected-route';
import { useAuthStore } from '@/store/auth-store';
import { server } from '@/mocks/server';
import { renderWithProviders } from '@/__tests__/test-utils';

const navigation = vi.hoisted(() => ({
  pathname: '/change-password',
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({
    replace: navigation.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    navigation.pathname = '/change-password';
    navigation.searchParams = new URLSearchParams();
    navigation.replace.mockReset();
  });

  it('redirects unauthenticated users through the protected route guard', async () => {
    renderWithProviders(
      <ProtectedRoute>
        <ChangePasswordForm />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/login?redirect=%2Fchange-password');
    });
    expect(screen.queryByRole('heading', { name: /Change password/i })).not.toBeInTheDocument();
  });

  it('validates old password, new password, and confirmation before submitting', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setAccessToken('current-access-token');
    });
    renderWithProviders(<ChangePasswordForm />);

    await user.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByText(/Current password is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please confirm your password/i)).toBeInTheDocument();
  });

  it('submits old and new passwords, omits confirmation, and keeps the user authenticated', async () => {
    const user = userEvent.setup();
    let submittedBody: Record<string, unknown> | null = null;
    let authorizationHeader: string | null = null;

    act(() => {
      useAuthStore.getState().setAccessToken('current-access-token');
    });

    server.use(
      http.put('/api/auth/change-password', async ({ request }) => {
        submittedBody = await request.json() as Record<string, unknown>;
        authorizationHeader = request.headers.get('Authorization');
        return HttpResponse.json({ message: 'Password changed successfully' });
      })
    );

    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/Current password/i, { selector: 'input' }), 'OldPass123');
    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'NewPass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'NewPass123');
    await user.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Your password has been changed successfully.'
    );
    expect(submittedBody).toEqual({
      old_password: 'OldPass123',
      new_password: 'NewPass123',
    });
    expect(submittedBody).not.toHaveProperty('confirm_password');
    expect(authorizationHeader).toBe('Bearer current-access-token');
    expect(useAuthStore.getState().accessToken).toBe('current-access-token');
  });

  it('shows API errors accessibly and keeps the current session', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setAccessToken('current-access-token');
    });

    server.use(
      http.put('/api/auth/change-password', () =>
        HttpResponse.json({ detail: 'Current password is incorrect.' }, { status: 400 })
      )
    );

    renderWithProviders(<ChangePasswordForm />);

    await user.type(screen.getByLabelText(/Current password/i, { selector: 'input' }), 'WrongPass123');
    await user.type(screen.getByLabelText(/New password/i, { selector: 'input' }), 'NewPass123');
    await user.type(screen.getByLabelText(/Confirm password/i, { selector: 'input' }), 'NewPass123');
    await user.click(screen.getByRole('button', { name: /Change password/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect.');
    expect(useAuthStore.getState().accessToken).toBe('current-access-token');
  });
});
