import { NextRequest, NextResponse } from 'next/server';
import {
  assertCsrfHeader,
  getBearerToken,
  missingBackendUrlResponse,
  safeJson,
  BACKEND_URL,
} from '../_bff-utils';

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const csrfErr = assertCsrfHeader(req);
  if (csrfErr) return csrfErr;
  if (!BACKEND_URL) return missingBackendUrlResponse();

  const authorization = getBearerToken(req);
  if (!authorization) {
    return NextResponse.json(
      { detail: 'Missing Authorization header' },
      { status: 401 }
    );
  }

  const body = await req.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
    },
    body: JSON.stringify(body),
  });

  const data = await safeJson(backendRes);
  return NextResponse.json(data, { status: backendRes.status });
}
