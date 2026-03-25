import { NextRequest, NextResponse } from 'next/server';
import { assertCsrfHeader, buildRefreshCookie, BACKEND_URL } from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  // Read the httpOnly cookie — browser sends it automatically on this path
  const refreshToken = req.cookies.get('gs_refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const { refresh_token, access_token, token_type } = data as {
    access_token: string;
    refresh_token: string;
    token_type: string;
  };

  const response = NextResponse.json({ access_token, token_type });
  // Re-set the cookie with the new refresh token (rotation)
  response.headers.set('Set-Cookie', buildRefreshCookie(refresh_token));
  return response;
}
