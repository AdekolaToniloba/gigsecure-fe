import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/__tests__/test-utils';
import { RecommendedProducts } from '@/components/risk-assessment/report/recommended-products';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  marketplaceProducts,
  marketplaceRecommendationHandlerScenarios,
} from '@/mocks/handlers/marketplace';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/store/auth-store';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
const RECOMMENDATIONS_URL = `${BASE}${ENDPOINTS.MARKETPLACE.RECOMMENDATIONS}`;
const PRODUCT_DETAIL_URL = `${BASE}${ENDPOINTS.MARKETPLACE.PRODUCTS}/:id`;

beforeEach(() => {
  act(() => {
    useAuthStore.getState().setSession({
      accessToken: 'full-session-risk-token',
      kycVerified: true,
      riskAssessed: true,
    });
  });
});

describe('RecommendedProducts', () => {
  it('sends one authenticated canonical request and renders validated API products', async () => {
    let requests = 0;
    server.use(
      http.get(RECOMMENDATIONS_URL, ({ request }) => {
        requests += 1;
        expect(request.headers.get('authorization')).toBe('Bearer full-session-risk-token');
        expect(new URL(request.url).searchParams.get('per_category')).toBe('3');
        return HttpResponse.json({
          recommended_categories: ['Income Protection', 'Equipment Protection'],
          items: marketplaceProducts.slice(0, 3),
        });
      }),
    );

    renderWithProviders(<RecommendedProducts />);

    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' }))
      .toBeVisible();
    expect(screen.getAllByRole('button', { name: /Open details for/i })).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Income Shield for Gig Workers' }).tagName)
      .toBe('H4');
    expect(screen.getByText('AXA Mansard')).toBeVisible();
    expect(screen.queryByText('Build an emergency fund.')).not.toBeInTheDocument();
    expect(requests).toBe(1);
  });

  it('deduplicates recommendation consumers through the canonical query key', async () => {
    let requests = 0;
    server.use(
      http.get(RECOMMENDATIONS_URL, () => {
        requests += 1;
        return HttpResponse.json({
          recommended_categories: [],
          items: marketplaceProducts.slice(0, 1),
        });
      }),
    );

    renderWithProviders(
      <>
        <RecommendedProducts />
        <RecommendedProducts />
      </>,
    );

    expect(await screen.findAllByRole('heading', { name: 'Income Shield for Gig Workers' }))
      .toHaveLength(2);
    expect(requests).toBe(1);
  });

  it('keeps the loading state isolated and mobile-safe', async () => {
    server.use(marketplaceRecommendationHandlerScenarios.delayed);
    renderWithProviders(<RecommendedProducts />);

    const loading = screen.getByRole('status', { name: 'Loading recommended plans' });
    expect(loading.firstElementChild?.nextElementSibling).toHaveClass(
      'grid-cols-1',
      'sm:grid-cols-2',
      'xl:grid-cols-3',
      'min-w-0',
    );
    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' }))
      .toBeVisible();
  });

  it('shows an honest empty state with a public marketplace path', async () => {
    server.use(marketplaceRecommendationHandlerScenarios.empty);
    renderWithProviders(<RecommendedProducts />);

    expect(await screen.findByRole('heading', { name: 'No recommended plans yet' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Browse marketplace' })).toHaveAttribute(
      'href',
      '/marketplace',
    );
  });

  it('shows parsed errors, does not retry automatically, and recovers on explicit retry', async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(RECOMMENDATIONS_URL, () => {
        requests += 1;
        return HttpResponse.json(
          { detail: 'Personalized plans are temporarily unavailable.' },
          { status: 400 },
        );
      }),
    );

    renderWithProviders(<RecommendedProducts />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Personalized plans are temporarily unavailable.',
    );
    expect(requests).toBe(1);

    server.use(
      http.get(RECOMMENDATIONS_URL, () => {
        requests += 1;
        return HttpResponse.json({
          recommended_categories: ['Income Protection', 'Equipment Protection'],
          items: marketplaceProducts.slice(0, 3),
        });
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByRole('heading', { name: 'Income Shield for Gig Workers' }))
      .toBeVisible();
    expect(requests).toBe(2);
  });

  it('opens product details by keyboard only after activation and restores opener focus', async () => {
    const user = userEvent.setup();
    let detailRequests = 0;
    server.use(
      marketplaceRecommendationHandlerScenarios.success,
      http.get(PRODUCT_DETAIL_URL, ({ params }) => {
        detailRequests += 1;
        const product = marketplaceProducts.find((item) => item.id === params.id);
        return HttpResponse.json(product);
      }),
    );

    renderWithProviders(<RecommendedProducts />);

    const opener = await screen.findByRole('button', {
      name: 'Open details for Income Shield for Gig Workers',
    });
    expect(detailRequests).toBe(0);
    opener.focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('dialog', { name: 'Income Shield for Gig Workers' }))
      .toBeVisible();
    await waitFor(() => expect(detailRequests).toBe(1));
    await user.click(screen.getByRole('button', { name: 'Close product details panel' }));
    await waitFor(() => expect(opener).toHaveFocus());
  });
});
