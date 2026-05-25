import { browserTokenResponseSchema } from '@/lib/validators/auth';

export type RefreshTokenFetcher = () => Promise<string>;

let activeRefreshPromise: Promise<string> | null = null;

export function refreshAccessTokenOnce(refresher: RefreshTokenFetcher) {
  if (!activeRefreshPromise) {
    activeRefreshPromise = refresher().finally(() => {
      activeRefreshPromise = null;
    });
  }

  return activeRefreshPromise;
}

export function resetRefreshQueueForTests() {
  activeRefreshPromise = null;
}

export function parseAccessTokenResponse(data: unknown) {
  return browserTokenResponseSchema.parse(data).access_token;
}

export function shouldSkipRefreshForWaitlistToken(token: string | null, now = Date.now()) {
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload) return false;

  return payload.scope === 'waitlist' && typeof payload.exp === 'number' && payload.exp * 1000 > now;
}

function parseJwtPayload(token: string) {
  const [, payloadSegment] = token.split('.');
  if (!payloadSegment) return null;

  try {
    const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = decodeBase64(padded);
    return JSON.parse(decoded) as { scope?: string; exp?: number };
  } catch {
    return null;
  }
}

function decodeBase64(value: string) {
  if (typeof atob === 'function') {
    return atob(value);
  }

  return Buffer.from(value, 'base64').toString('utf8');
}
