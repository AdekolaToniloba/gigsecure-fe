import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMarketplaceRecommendationsGate } from '@/hooks/marketplace/useMarketplaceRecommendationsGate';
import { marketplaceService } from '@/services/marketplace.service';
import { useAuthStore } from '@/store/auth-store';
import { mockRouter } from '@/__tests__/test-utils';

beforeEach(() => {
  mockRouter.push.mockReset();
  vi.restoreAllMocks();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('useMarketplaceRecommendationsGate', () => {
  it('routes unauthenticated users to login without requesting recommendations', () => {
    const recommendationsSpy = vi.spyOn(marketplaceService, 'getRecommendations');
    const { result } = renderHook(() => useMarketplaceRecommendationsGate(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.requestRecommendations();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=%2Fmarketplace');
    expect(recommendationsSpy).not.toHaveBeenCalled();
  });

  it('routes authenticated users without a risk assessment to the assessment wizard', () => {
    const recommendationsSpy = vi.spyOn(marketplaceService, 'getRecommendations');
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: false,
      });
    });
    const { result } = renderHook(() => useMarketplaceRecommendationsGate(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.requestRecommendations();
    });

    expect(mockRouter.push).toHaveBeenCalledWith('/assessment');
    expect(recommendationsSpy).not.toHaveBeenCalled();
  });

  it('loads recommendations only after an assessed authenticated user requests them', async () => {
    const recommendationsSpy = vi.spyOn(marketplaceService, 'getRecommendations');
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });
    const { result } = renderHook(() => useMarketplaceRecommendationsGate(), {
      wrapper: createWrapper(),
    });

    expect(recommendationsSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.requestRecommendations();
    });

    await waitFor(() => {
      expect(result.current.isRecommendationsReady).toBe(true);
    });
    expect(recommendationsSpy).toHaveBeenCalledTimes(1);
    expect(result.current.recommendations?.items).toHaveLength(3);
  });
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return Wrapper;
}
