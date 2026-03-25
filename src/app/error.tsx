'use client';

import { useEffect } from 'react';
import ErrorFallback from '@/components/ui/ErrorFallback';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error for future tracking (e.g. Sentry)
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <ErrorFallback
        title="Something went wrong"
        message={
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred. Our team has been notified.'
        }
        onReset={reset}
      />
    </main>
  );
}
