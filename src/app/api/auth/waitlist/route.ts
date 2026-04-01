import { NextRequest, NextResponse } from 'next/server';
import { assertCsrfHeader, buildRefreshCookie, BACKEND_URL } from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;

  const body = await req.json();

  let backendRes;
  try {
    if (!BACKEND_URL) throw new Error("BACKEND_URL is perfectly undefined in Vercel environment.");
    backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/waitlist/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Internal Server Error (Backend Fetch Failed)', details: error.message },
      { status: 500 }
    );
  }

  const responseText = await backendRes.text();
  let data;
  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch {
    data = { message: responseText || backendRes.statusText };
  }

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
