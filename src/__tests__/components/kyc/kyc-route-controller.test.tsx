import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KycRouteController } from '@/components/kyc/kyc-route-controller';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const navigation = vi.hoisted(() => ({
  pathname: '/kyc',
  searchParams: new URLSearchParams(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({
    replace: navigation.replace,
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

beforeEach(() => {
  navigation.pathname = '/kyc';
  navigation.searchParams = new URLSearchParams();
  navigation.replace.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KycRouteController', () => {
  it('redirects unauthenticated users to login with a safe KYC return path', async () => {
    act(() => {
      useAuthStore.getState().setUnauthenticated();
    });

    renderWithQueryClient(
      <KycRouteController>
        <p>KYC content</p>
      </KycRouteController>
    );

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith('/login?redirect=%2Fkyc');
    });
    expect(screen.queryByText('KYC content')).not.toBeInTheDocument();
  });

  it('waits during auth initialization without redirecting or rendering content', () => {
    act(() => {
      useAuthStore.getState().setAuthInitializing();
    });

    renderWithQueryClient(
      <KycRouteController>
        <p>KYC content</p>
      </KycRouteController>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/Checking your verification status/i);
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(screen.queryByText('KYC content')).not.toBeInTheDocument();
  });

  it('renders KYC content for authenticated unverified users after profile flag sync', async () => {
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    renderWithQueryClient(
      <KycRouteController>
        <p>KYC content</p>
      </KycRouteController>
    );

    await waitFor(() => {
      expect(screen.getByText('KYC content')).toBeInTheDocument();
    });
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('renders KYC content for authenticated verified users after profile flag sync', async () => {
    server.use(
      http.get(`${baseUrl}/api/v1/users/me`, () =>
        HttpResponse.json({
          user: {
            id: '00000000-0000-0000-0000-000000000000',
            email: 'test@gigsecure.com',
            first_name: 'Test',
            last_name: 'User',
            status: 'active',
            role: 'user',
            email_verified: true,
            phone_number: null,
            last_login_at: null,
            created_at: '2026-04-24T10:00:00Z',
          },
          profile: null,
          kyc_verified: true,
          risk_assessed: true,
        })
      )
    );

    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    renderWithQueryClient(
      <KycRouteController>
        <p>KYC content</p>
      </KycRouteController>
    );

    await waitFor(() => {
      expect(screen.getByText('KYC content')).toBeInTheDocument();
    });
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}
