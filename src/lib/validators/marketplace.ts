import { z } from 'zod';

const decimalString = z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/);

export const providerRefSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  logo_url: z.string().nullable().optional().default(null),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string(),
  premium_amount: decimalString,
  premium_currency: z.string(),
  coverage_amount: decimalString,
  renewal_frequency: z.string(),
  risk_level: z.string().nullable().optional().default(null),
  is_active: z.boolean(),
  provider: providerRefSchema,
});

export const productListResponseSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive().max(100),
  offset: z.number().int().nonnegative(),
});

export const recommendedProductsResponseSchema = z.object({
  recommended_categories: z.array(z.string()),
  items: z.array(productSchema),
});

export const marketplaceFiltersSchema = z.object({
  category: z.array(z.string()).optional(),
  provider_slug: z.array(z.string()).optional(),
  risk_level: z.array(z.string()).optional(),
  q: z.string().max(128).optional(),
  min_premium: z.coerce.number().nonnegative().optional(),
  max_premium: z.coerce.number().nonnegative().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type ProviderRef = z.infer<typeof providerRefSchema>;
export type Product = z.infer<typeof productSchema>;
export type ProductListResponse = z.infer<typeof productListResponseSchema>;
export type RecommendedProductsResponse = z.infer<typeof recommendedProductsResponseSchema>;
export type MarketplaceFilters = z.infer<typeof marketplaceFiltersSchema>;
