'use client';

import React, { type ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorFallback } from './ErrorFallback';

interface Props {
  children: ReactNode;
}

export function QueryErrorBoundary({ children }: Props) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorFallback
          error={error as Error}
          onReset={resetErrorBoundary}
          fullPage={false}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}
