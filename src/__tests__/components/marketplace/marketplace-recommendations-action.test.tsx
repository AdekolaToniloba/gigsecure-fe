import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarketplaceRecommendationsAction } from '@/components/marketplace/recommendations/marketplace-recommendations-action';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

const recommendationsUrl = 'http://localhost:8000/api/v1/marketplace/recommendations';

beforeEach(() => {
  mockRouter.push.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('MarketplaceRecommendationsAction', () => {
  it('routes unauthenticated users to login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MarketplaceRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(mockRouter.push).toHaveBeenCalledWith('/login?redirect=%2Fmarketplace');
  });

  it('routes authenticated users without a risk assessment to the wizard', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: false,
      });
    });
    renderWithProviders(<MarketplaceRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(mockRouter.push).toHaveBeenCalledWith('/assessment');
  });

  it('shows accessible loading and success states for assessed authenticated users', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(recommendationsUrl, async () => {
        await delay(100);
        return HttpResponse.json({
          recommended_categories: ['Income Protection'],
          items: [
            {
              id: 'prod-income',
              name: 'Income Shield for Gig Workers',
              category: 'Income Protection',
              description: 'Income cover for gig workers.',
              premium_amount: '9500',
              premium_currency: 'NGN',
              coverage_amount: '130000',
              renewal_frequency: 'monthly',
              risk_level: 'low',
              is_active: true,
              provider: {
                id: 'provider-axa',
                slug: 'axa-mansard',
                name: 'AXA Mansard',
                logo_url: null,
              },
            },
          ],
        });
      })
    );
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });
    renderWithProviders(<MarketplaceRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(await screen.findByText('Loading personalized recommendations...')).toHaveAttribute(
      'role',
      'status'
    );
    expect(await screen.findByText('1 personalized plan is ready.')).toHaveAttribute('role', 'status');
  });

  it('shows parsed recommendation errors and offers a retry action', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(recommendationsUrl, () =>
        HttpResponse.json({ detail: 'Recommendations are temporarily unavailable.' }, { status: 400 })
      )
    );
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });
    renderWithProviders(<MarketplaceRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Recommendations are temporarily unavailable.');
    });
    expect(screen.getByRole('button', { name: /Try Recommendations Again/i })).toBeInTheDocument();
  });

  it('disables the action while session access is resolving', () => {
    act(() => {
      useAuthStore.getState().setAuthInitializing();
    });
    renderWithProviders(<MarketplaceRecommendationsAction />);

    expect(screen.getByRole('button', { name: /View Recommendations/i })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Checking recommendation access...');
  });
});
