import { z } from 'zod';
import type { DashboardOverview, IncomeStabilityPattern } from '@/types/dashboard';

export const incomeStabilityPatternSchema: z.ZodType<IncomeStabilityPattern> = z.object({
  score: z.number().int(),
  classification: z.string(),
  graph_points: z.array(z.number()),
});

export const dashboardOverviewSchema: z.ZodType<DashboardOverview> = z.object({
  premiums_bought: z.number().int().nonnegative().default(0),
  monthly_income_band: z.string().nullable().optional(),
  safety_buffer: z.string().nullable().optional(),
  recommended_plans_count: z.number().int().nonnegative().default(0),
  income_stability: incomeStabilityPatternSchema.nullable().optional(),
  has_assessment: z.boolean().default(false),
});
