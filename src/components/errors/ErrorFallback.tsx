'use client';

import { type AxiosError } from 'axios';

interface Props {
  error: Error | AxiosError;
  onReset: () => void;
  fullPage?: boolean;
}

function getErrorMessage(error: Error): string {
  if (process.env.NODE_ENV !== 'production') {
    return error.message;
  }
  // Never expose raw error details in production
  const isNetwork = error.message?.toLowerCase().includes('network');
  if (isNetwork) return 'A network error occurred. Please check your connection.';
  return 'Something went wrong. Please try again.';
}

function getErrorTitle(error: Error): string {
  if (process.env.NODE_ENV !== 'production') return error.name || 'Error';
  return 'Something went wrong';
}

export function ErrorFallback({ error, onReset, fullPage = false }: Props) {
  const message = getErrorMessage(error);
  const title = getErrorTitle(error);

  const content = (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500 max-w-xs">{message}</p>
      </div>
      <button
        onClick={onReset}
        className="mt-2 rounded-lg bg-[#00676E] px-6 py-2 text-sm font-medium text-white hover:bg-[#034C51] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE419] cursor-pointer"
      >
        Try again
      </button>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        {content}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-100 bg-red-50">
      {content}
    </div>
  );
}
