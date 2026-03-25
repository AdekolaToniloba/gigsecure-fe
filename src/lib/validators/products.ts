import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().optional(),
  currency: z.string().optional().default('NGN'),
  provider: z.string().optional(),
  featured: z.boolean().optional().default(false),
  created_at: z.string().optional(),
});

export const productsListResponseSchema = z.array(productSchema);

// ─── Inferred Types ────────────────────────────────────────────────
export type Product = z.infer<typeof productSchema>;
export type ProductsListResponse = z.infer<typeof productsListResponseSchema>;
