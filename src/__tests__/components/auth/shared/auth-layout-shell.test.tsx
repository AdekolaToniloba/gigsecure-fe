import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthLayoutShell from '@/components/auth/shared/auth-layout-shell';

let pathname = '/login';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
}));

vi.mock('next/image', async () => ({
  default: (await import('@/__tests__/mock-components')).MockImage,
}));

describe('AuthLayoutShell', () => {
  afterEach(() => {
    cleanup();
    pathname = '/login';
  });

  it.each([
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/activate',
    '/verify-email',
    '/check-inbox',
  ])('renders the shared auth header and cancel link for %s', (route) => {
    pathname = route;

    render(
      <AuthLayoutShell>
        <h1>Auth content</h1>
      </AuthLayoutShell>
    );

    expect(screen.getByRole('link', { name: /GigSecure home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /Cancel/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('main')).toHaveTextContent('Auth content');
  });

  it('uses the login-specific image on the login route', () => {
    pathname = '/login';

    render(
      <AuthLayoutShell>
        <h1>Login</h1>
      </AuthLayoutShell>
    );

    expect(screen.getByAltText('Gig worker seated at a desk looking focused')).toHaveAttribute(
      'src',
      '/assets/images/auth-login.png'
    );
  });

  it('uses the reset image for password reset routes', () => {
    pathname = '/forgot-password';

    render(
      <AuthLayoutShell>
        <h1>Forgot password</h1>
      </AuthLayoutShell>
    );

    expect(screen.getByAltText('Gig worker in an orange jacket working on a laptop')).toHaveAttribute(
      'src',
      '/assets/images/auth-forgot-password.png'
    );
  });
});
