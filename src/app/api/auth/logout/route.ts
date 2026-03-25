import { NextRequest, NextResponse } from 'next/server';
import { assertCsrfHeader, clearRefreshCookie } from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.headers.set('Set-Cookie', clearRefreshCookie());
  return response;
}
