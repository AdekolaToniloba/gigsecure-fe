'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { parseApiError } from '@/lib/api/errors';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { useVerifyEmail } from '@/hooks/auth/useAuth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthStatus } from '@/components/auth/shared/auth-status';

type VerifyEmailStatusProps = {
  token: string | null;
};

function SupportLinks() {
  return (
    <p className="mt-6 text-center text-sm text-slate-500">
      Need a new link?{' '}
      <Link
        href="/check-inbox"
        className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
      >
        Resend activation email
      </Link>
    </p>
  );
}

export default function VerifyEmailStatus({ token }: VerifyEmailStatusProps) {
  const router = useRouter();
  const hasSubmitted = useRef(false);
  const verifyEmail = useVerifyEmail();
  const { error, isError, isSuccess, mutate } = verifyEmail;

  const cleanToken = useMemo(() => token?.trim() ?? '', [token]);

  useEffect(() => {
    if (!cleanToken || hasSubmitted.current) return;

    hasSubmitted.current = true;
    mutate({ token: cleanToken });
  }, [cleanToken, mutate]);

  useEffect(() => {
    if (!isSuccess) return;

    router.replace(DEFAULT_AUTHENTICATED_PATH);
  }, [isSuccess, router]);

  if (!cleanToken) {
    return (
      <div className="w-full max-w-[24rem]">
        <AuthStatus
          title="Verification link missing"
          description="Open the verification link from your email, or request a new activation email to continue."
          icon={<AlertTriangle aria-hidden="true" className="h-7 w-7" />}
          className="[&>div]:bg-red-600"
        />
        <SupportLinks />
      </div>
    );
  }

  if (isError) {
    const parsedError = parseApiError(error);

    return (
      <div className="w-full max-w-[24rem]">
        <AuthStatus
          title="Email verification failed"
          description="This verification link may be invalid, expired, or already used."
          icon={<AlertTriangle aria-hidden="true" className="h-7 w-7" />}
          className="[&>div]:bg-red-600"
        />
        <AuthAlert variant="error" title="Could not verify email" className="mt-6">
          {parsedError.message}
        </AuthAlert>
        <SupportLinks />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <AuthStatus
        title="Email verified"
        description="Your account is active. Taking you to your GigSecure dashboard."
        icon={<Check aria-hidden="true" className="h-7 w-7" />}
      />
    );
  }

  return (
    <AuthStatus
      title="Verifying email"
      description="Please wait while we confirm your email address."
      icon={<Loader2 aria-hidden="true" className="h-7 w-7 animate-spin" />}
      className="[&>div]:bg-primary"
    />
  );
}
