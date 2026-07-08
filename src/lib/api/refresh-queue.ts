import { browserTokenResponseSchema } from '@/lib/validators/auth';
import type { BrowserTokenResponse } from '@/types/auth';

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
  return parseBrowserSessionResponse(data).access_token;
}

export function parseBrowserSessionResponse(data: unknown): BrowserTokenResponse {
  return browserTokenResponseSchema.parse(data);
}

export function shouldAttemptSessionRefresh(hasFullSession: boolean) {
  return hasFullSession;
}
