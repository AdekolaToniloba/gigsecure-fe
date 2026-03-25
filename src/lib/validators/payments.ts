import { z } from 'zod';

export const paymentStatusSchema = z.enum([
  'pending',
  'success',
  'failed',
  'abandoned',
]);

export const paymentSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  policy_id: z.string().optional(),
  status: paymentStatusSchema,
  amount: z.coerce.number(),
  currency: z.string().optional().default('NGN'),
  reference: z.string().optional(),
  authorization_url: z.string().optional(),
  created_at: z.string().optional(),
  paid_at: z.string().nullable().optional(),
});

export const paymentsHistoryResponseSchema = z.array(paymentSchema);

export const initializePaymentResponseSchema = z.object({
  payment_id: z.string(),
  authorization_url: z.string(),
  reference: z.string(),
});

// ─── Inferred Types ────────────────────────────────────────────────
export type Payment = z.infer<typeof paymentSchema>;
export type PaymentsHistoryResponse = z.infer<typeof paymentsHistoryResponseSchema>;
export type InitializePaymentResponse = z.infer<typeof initializePaymentResponseSchema>;
