import { NextRequest, NextResponse } from 'next/server';
import {
  assertCsrfHeader,
  missingBackendUrlResponse,
  safeJson,
  BACKEND_URL,
} from '../_bff-utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;
  if (!BACKEND_URL) return missingBackendUrlResponse();

  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await safeJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
