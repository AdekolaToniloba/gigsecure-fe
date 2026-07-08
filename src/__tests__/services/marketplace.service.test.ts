import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { marketplaceService } from '@/services/marketplace.service';
import { useAuthStore } from '@/store/auth-store';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

describe('marketplace services', () => {
  it('filters marketplace products through repeated query params', async () => {
    const result = await marketplaceService.listProducts({
      category: ['Income Protection'],
      provider_slug: ['axa-mansard'],
      risk_level: ['low'],
      max_premium: 10000,
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('prod-income');
  });

  it('gets detail and recommendation payloads', async () => {
    await expect(marketplaceService.getProduct('prod-equipment')).resolves.toMatchObject({
      category: 'Equipment Protection',
    });
    useAuthStore.getState().setSession({
      accessToken: 'marketplace-access-token',
      kycVerified: false,
      riskAssessed: true,
    });
    await expect(marketplaceService.getRecommendations()).resolves.toMatchObject({
      recommended_categories: ['Income Protection', 'Equipment Protection'],
    });
  });

  it('keeps catalog requests public and authenticates recommendations', async () => {
    expect.assertions(3);
    useAuthStore.getState().setSession({
      accessToken: 'marketplace-access-token',
      kycVerified: false,
      riskAssessed: true,
    });

    server.use(
      http.get(`${baseUrl}/api/v1/marketplace/products`, ({ request }) => {
        expect(request.headers.get('authorization')).toBeNull();
        return HttpResponse.json({ items: [], total: 0, limit: 20, offset: 0 });
      }),
      http.get(`${baseUrl}/api/v1/marketplace/recommendations`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer marketplace-access-token');
        return HttpResponse.json({ recommended_categories: [], items: [] });
      })
    );

    await marketplaceService.listProducts();
    const recommendations = await marketplaceService.getRecommendations();
    expect(recommendations.items).toEqual([]);
  });
});
