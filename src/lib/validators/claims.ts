import { z } from 'zod';

export const claimStatusSchema = z.enum([
  'pending',
  'under_review',
  'approved',
  'denied',
  'info_requested',
]);

export const claimSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  policy_id: z.string(),
  status: claimStatusSchema,
  description: z.string().optional(),
  amount_claimed: z.coerce.number().optional(),
  amount_approved: z.coerce.number().nullable().optional(),
  currency: z.string().optional().default('NGN'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const claimsListResponseSchema = z.array(claimSchema);

export const claimStatusResponseSchema = z.object({
  claim_id: z.string(),
  status: claimStatusSchema,
  updated_at: z.string().optional(),
});

export const submitClaimRequestSchema = z.object({
  policy_id: z.string(),
  description: z.string().min(10),
  amount_claimed: z.number().positive(),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type Claim = z.infer<typeof claimSchema>;
export type ClaimStatus = z.infer<typeof claimStatusSchema>;
export type ClaimsListResponse = z.infer<typeof claimsListResponseSchema>;
export type SubmitClaimRequest = z.infer<typeof submitClaimRequestSchema>;
export type ClaimStatusResponse = z.infer<typeof claimStatusResponseSchema>;
