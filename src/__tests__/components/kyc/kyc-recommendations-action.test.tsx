import React from 'react';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { KycRecommendationsAction } from '@/components/kyc/dashboard/kyc-recommendations-action';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';
import { mockRouter, renderWithProviders } from '@/__tests__/test-utils';

const recommendationsUrl = 'http://localhost:8000/api/v1/risk/recommendations';

beforeEach(() => {
  mockRouter.push.mockReset();
  act(() => {
    useAuthStore.getState().clearAuth();
  });
});

describe('KycRecommendationsAction', () => {
  it('opens the KYC required modal for unverified users and routes the CTA to KYC', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: false,
        riskAssessed: true,
      });
    });

    renderWithProviders(<KycRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(screen.getByRole('dialog', { name: /KYC verification required/i })).toHaveAccessibleDescription(
      /before viewing your coverage recommendations/i
    );

    await user.click(screen.getByRole('button', { name: /Go to KYC/i }));

    expect(mockRouter.push).toHaveBeenCalledWith('/kyc?redirect=%2Fdashboard');
  });

  it('shows a loading state while verified users fetch recommendations', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(recommendationsUrl, async () => {
        await delay(100);
        return HttpResponse.json({
          recommendations: ['Coverage fit is still being calculated.'],
        });
      })
    );
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    renderWithProviders(<KycRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(screen.getByRole('button', { name: /Loading plan/i })).toHaveAttribute('aria-busy', 'true');
    expect(await screen.findByText('Coverage fit is still being calculated.')).toBeInTheDocument();
  });

  it('shows recommendations for verified users after the endpoint succeeds', async () => {
    const user = userEvent.setup();
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    renderWithProviders(<KycRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    expect(await screen.findByText(/Diversify your client base/i)).toBeInTheDocument();
  });

  it('shows a parsed user-friendly error when recommendations fail', async () => {
    const user = userEvent.setup();
    server.use(
      http.get(recommendationsUrl, () =>
        HttpResponse.json({ detail: 'Recommendations are temporarily unavailable.' }, { status: 400 })
      )
    );
    act(() => {
      useAuthStore.getState().setSession({
        accessToken: 'access-token',
        kycVerified: true,
        riskAssessed: true,
      });
    });

    renderWithProviders(<KycRecommendationsAction />);

    await user.click(screen.getByRole('button', { name: /View Recommendations/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Recommendations are temporarily unavailable.');
    });
  });
});
