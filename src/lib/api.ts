import type { ApiError } from '@/types';

/**
 * Base fetch utility used by React Query query functions.
 * Handles JSON parsing and throws a typed ApiError on non-2xx responses.
 */
export async function fetchApi<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorBody: Partial<ApiError> = {};
    try {
      errorBody = await res.json();
    } catch {
      // Body may not be JSON; fall back to status text.
    }

    const error: ApiError = {
      message: errorBody.message ?? res.statusText,
      statusCode: res.status,
      errors: errorBody.errors,
    };

    throw error;
  }

  return res.json() as Promise<T>;
}
