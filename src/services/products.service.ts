import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  productSchema,
  productsListResponseSchema,
  type Product,
} from '@/lib/validators/products';

function parseOrThrow<T>(schema: { parse: (data: unknown) => T }, data: unknown, context: string): T {
  try {
    return schema.parse(data);
  } catch (err) {
    console.error(`[Zod] Validation failed in ${context}:`, err);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const productsService = {
  async listProducts(signal?: AbortSignal): Promise<Product[]> {
    const { data } = await apiClient.get(ENDPOINTS.PRODUCTS.LIST, { signal });
    return parseOrThrow(productsListResponseSchema, data, 'productsService.listProducts');
  },

  async getFeaturedProducts(signal?: AbortSignal): Promise<Product[]> {
    const { data } = await apiClient.get(ENDPOINTS.PRODUCTS.FEATURED, { signal });
    return parseOrThrow(productsListResponseSchema, data, 'productsService.getFeaturedProducts');
  },

  async getProduct(id: string, signal?: AbortSignal): Promise<Product> {
    const { data } = await apiClient.get(ENDPOINTS.PRODUCTS.DETAIL(id), { signal });
    return parseOrThrow(productSchema, data, 'productsService.getProduct');
  },
};
