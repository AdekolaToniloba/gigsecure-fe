import { z } from 'zod';

export const policyStatusSchema = z.enum(['active', 'expired', 'cancelled', 'pending']);

export const policySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  product_id: z.string(),
  status: policyStatusSchema,
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  premium: z.coerce.number().optional(),
  currency: z.string().optional().default('NGN'),
  created_at: z.string().optional(),
});

export const policiesListResponseSchema = z.array(policySchema);

export const createPolicyRequestSchema = z.object({
  product_id: z.string(),
  start_date: z.string().optional(),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type Policy = z.infer<typeof policySchema>;
export type PoliciesListResponse = z.infer<typeof policiesListResponseSchema>;
export type CreatePolicyRequest = z.infer<typeof createPolicyRequestSchema>;
