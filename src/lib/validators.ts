import { z } from 'zod';

// ─── Email ─────────────────────────────────────────────────────────
// Zod v4: z.email() lives at top-level, not z.string().email()
export const emailSchema = z.email('Please enter a valid email address');

// ─── Pagination ────────────────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
