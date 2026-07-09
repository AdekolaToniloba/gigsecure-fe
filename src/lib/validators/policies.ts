import { z } from 'zod';

const decimalString = z.string().regex(/^(?!^[-+.]*$)[+-]?0*\d*\.?\d*$/);

export const policyProductSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  provider_name: z.string(),
  provider_slug: z.string(),
});

export const policySchema = z.object({
  id: z.string(),
  status: z.string(),
  display_status: z.string(),
  coverage_amount: decimalString,
  premium_amount: decimalString,
  premium_currency: z.string(),
  renewal_frequency: z.string(),
  start_date: z.string().nullable().optional().default(null),
  end_date: z.string().nullable().optional().default(null),
  purchased_at: z.string().nullable().optional().default(null),
  external_policy_id: z.string().nullable().optional().default(null),
  created_at: z.string(),
  product: policyProductSummarySchema,
});

export const policiesListResponseSchema = z.object({
  items: z.array(policySchema),
});

export const policySummarySchema = z.object({
  total_coverage: decimalString,
  active_count: z.number().int().nonnegative(),
  due_soon_count: z.number().int().nonnegative(),
});

export const createPolicyRequestSchema = z.object({
  product_id: z.string().min(1),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type PolicyProductSummary = z.infer<typeof policyProductSummarySchema>;
export type Policy = z.infer<typeof policySchema>;
export type PoliciesListResponse = z.infer<typeof policiesListResponseSchema>;
export type PolicySummary = z.infer<typeof policySummarySchema>;
export type CreatePolicyRequest = z.infer<typeof createPolicyRequestSchema>;
