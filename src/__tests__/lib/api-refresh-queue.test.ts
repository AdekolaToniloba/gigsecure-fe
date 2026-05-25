import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  refreshAccessTokenOnce,
  resetRefreshQueueForTests,
  shouldSkipRefreshForWaitlistToken,
} from '@/lib/api/refresh-queue';

beforeEach(() => {
  resetRefreshQueueForTests();
});

describe('refreshAccessTokenOnce', () => {
  it('shares one active refresh promise across concurrent callers', async () => {
    const refresher = vi.fn(async () => 'new-access-token');

    const [first, second, third] = await Promise.all([
      refreshAccessTokenOnce(refresher),
      refreshAccessTokenOnce(refresher),
      refreshAccessTokenOnce(refresher),
    ]);

    expect(refresher).toHaveBeenCalledTimes(1);
    expect([first, second, third]).toEqual([
      'new-access-token',
      'new-access-token',
      'new-access-token',
    ]);
  });

  it('allows a new refresh after the active refresh settles', async () => {
    const refresher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('first-token')
      .mockResolvedValueOnce('second-token');

    await expect(refreshAccessTokenOnce(refresher)).resolves.toBe('first-token');
    await expect(refreshAccessTokenOnce(refresher)).resolves.toBe('second-token');

    expect(refresher).toHaveBeenCalledTimes(2);
  });

  it('shares refresh failures and then resets the queue', async () => {
    const refreshError = new Error('refresh failed');
    const refresher = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(refreshError)
      .mockResolvedValueOnce('recovered-token');

    const attempts = Promise.allSettled([
      refreshAccessTokenOnce(refresher),
      refreshAccessTokenOnce(refresher),
    ]);

    await expect(attempts).resolves.toEqual([
      { status: 'rejected', reason: refreshError },
      { status: 'rejected', reason: refreshError },
    ]);

    await expect(refreshAccessTokenOnce(refresher)).resolves.toBe('recovered-token');
    expect(refresher).toHaveBeenCalledTimes(2);
  });
});

describe('shouldSkipRefreshForWaitlistToken', () => {
  it('skips refresh for non-expired waitlist tokens', () => {
    const token = createJwt({ scope: 'waitlist', exp: 2_000 });

    expect(shouldSkipRefreshForWaitlistToken(token, 1_000_000)).toBe(true);
  });

  it('does not skip refresh for expired waitlist tokens', () => {
    const token = createJwt({ scope: 'waitlist', exp: 1_000 });

    expect(shouldSkipRefreshForWaitlistToken(token, 2_000_000)).toBe(false);
  });

  it('does not skip refresh for authenticated tokens', () => {
    const token = createJwt({ scope: 'authenticated', exp: 2_000 });

    expect(shouldSkipRefreshForWaitlistToken(token, 1_000_000)).toBe(false);
  });
});

function createJwt(payload: Record<string, unknown>) {
  return ['header', encodeBase64Url(JSON.stringify(payload)), 'signature'].join('.');
}

function encodeBase64Url(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
