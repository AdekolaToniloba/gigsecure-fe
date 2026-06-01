import { NextRequest, NextResponse } from 'next/server';
import {
  assertCsrfHeader,
  COOKIE_NAME,
  createBrowserSessionResponse,
  missingBackendUrlResponse,
  safeJson,
  BACKEND_URL,
} from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;
  if (!BACKEND_URL) return missingBackendUrlResponse();

  // Read the httpOnly cookie — browser sends it automatically on this path
  const refreshToken = req.cookies.get(COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: 'No refresh token' }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await safeJson(backendRes);

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  return createBrowserSessionResponse(data);
}
