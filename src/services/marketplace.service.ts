import axios from 'axios';
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  marketplaceFiltersSchema,
  productListResponseSchema,
  productSchema,
  recommendedProductsResponseSchema,
  type MarketplaceFilters,
} from '@/lib/validators/marketplace';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`[Zod] Validation failed in ${context}:`, error);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

function toSearchParams(filters: MarketplaceFilters) {
  const parsed = marketplaceFiltersSchema.parse(filters);
  const params = new URLSearchParams();
  for (const key of ['category', 'provider_slug', 'risk_level'] as const) {
    parsed[key]?.forEach((value) => params.append(key, value));
  }
  for (const key of ['q', 'min_premium', 'max_premium', 'limit', 'offset'] as const) {
    const value = parsed[key];
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params;
}

const publicMarketplaceClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: 15_000,
});

export const marketplaceService = {
  async listProducts(filters: MarketplaceFilters = {}, signal?: AbortSignal) {
    const { data } = await publicMarketplaceClient.get(ENDPOINTS.MARKETPLACE.PRODUCTS, {
      params: toSearchParams(filters),
      signal,
    });
    return parseOrThrow(productListResponseSchema, data, 'marketplaceService.listProducts');
  },

  async getProduct(id: string, signal?: AbortSignal) {
    const { data } = await publicMarketplaceClient.get(ENDPOINTS.MARKETPLACE.PRODUCT_DETAIL(id), { signal });
    return parseOrThrow(productSchema, data, 'marketplaceService.getProduct');
  },

  async getRecommendations(perCategory = 3, signal?: AbortSignal) {
    const { data } = await apiClient.get(ENDPOINTS.MARKETPLACE.RECOMMENDATIONS, {
      params: { per_category: perCategory },
      signal,
    });
    return parseOrThrow(
      recommendedProductsResponseSchema,
      data,
      'marketplaceService.getRecommendations'
    );
  },
};
