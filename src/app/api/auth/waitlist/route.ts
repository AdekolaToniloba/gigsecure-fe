import { NextRequest, NextResponse } from 'next/server';
import { assertCsrfHeader, buildRefreshCookie, BACKEND_URL } from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/waitlist/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const { access_token, user_id, message, token_type } = data as {
    access_token: string;
    user_id: string;
    message: string;
    token_type: string;
  };

  // Waitlist signup also returns an access token (for risk assessment).
  // Treat it the same way — no refresh token for waitlist users.
  const response = NextResponse.json({ access_token, user_id, message, token_type });
  return response;
}
