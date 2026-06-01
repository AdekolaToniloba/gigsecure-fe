import { NextRequest, NextResponse } from 'next/server';
import {
  assertCsrfHeader,
  clearLegacyRefreshCookie,
  clearRefreshCookie,
} from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  // No backend logout endpoint is documented yet, so this BFF logout only
  // expires the browser-held refresh cookie. Backend invalidation should be
  // added here if the API exposes it later.
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.headers.set('Set-Cookie', clearRefreshCookie());
  response.headers.append('Set-Cookie', clearLegacyRefreshCookie());
  return response;
}
