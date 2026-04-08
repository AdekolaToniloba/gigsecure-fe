import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!env.STAGING_PASSWORD) {
      return NextResponse.json({ error: 'Staging password is not configured on the server.' }, { status: 500 });
    }

    if (password === env.STAGING_PASSWORD) {
      const response = NextResponse.json({ success: true });
      // Set the staging auth cookie securely
      response.cookies.set('gs_staging_auth', 'authenticated', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 1 week
      });
      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
