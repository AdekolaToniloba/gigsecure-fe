import { NextRequest, NextResponse } from 'next/server';
import { assertCsrfHeader, buildRefreshCookie, BACKEND_URL } from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

  const response = NextResponse.json({ access_token, token_type }, { status: 201 });
  response.headers.set('Set-Cookie', buildRefreshCookie(refresh_token));
  return response;
}
