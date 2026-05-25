import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { middleware } from '@/middleware';

describe('middleware auth routing', () => {
  it('redirects protected app routes without a refresh cookie to login with a safe return path', () => {
    const res = middleware(request('https://app.gigsecure.test/dashboard?tab=policies'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://app.gigsecure.test/login?redirect=%2Fdashboard%3Ftab%3Dpolicies'
    );
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('allows protected app routes when the refresh cookie exists', () => {
    const res = middleware(
      request('https://app.gigsecure.test/dashboard', 'gs_refresh_token=refresh-token')
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });

  it('redirects authenticated users away from public-only auth pages', () => {
    const res = middleware(
      request('https://app.gigsecure.test/login?redirect=%2Fdashboard', 'gs_refresh_token=refresh-token')
    );

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://app.gigsecure.test/dashboard');
  });

  it('does not allow external redirect params for authenticated public-only pages', () => {
    const res = middleware(
      request(
        'https://app.gigsecure.test/login?redirect=https%3A%2F%2Fevil.example',
        'gs_refresh_token=refresh-token'
      )
    );

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://app.gigsecure.test/dashboard');
  });

  it('keeps required email-link auth routes reachable without a session', () => {
    const res = middleware(request('https://app.gigsecure.test/verify-email?token=abc'));

    expect(res.status).toBe(200);
    expect(res.headers.get('location')).toBeNull();
  });
});

function request(url: string, cookie?: string) {
  return new NextRequest(url, {
    headers: cookie ? { cookie } : undefined,
  });
}
