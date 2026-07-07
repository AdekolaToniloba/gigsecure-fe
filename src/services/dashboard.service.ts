import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';
import { dashboardOverviewSchema } from '@/lib/validators/dashboard';
import type { DashboardOverviewResponse } from '@/types/dashboard';

function parseOrThrow<T>(
  schema: { parse: (data: unknown) => T },
  data: unknown,
  context: string,
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    console.error(`[Zod] Validation failed in ${context}:`, error);
    throw new Error(`Invalid API response shape in ${context}`);
  }
}

export const dashboardService = {
  async getOverview(signal?: AbortSignal): Promise<DashboardOverviewResponse> {
    const { data } = await apiClient.get(ENDPOINTS.DASHBOARD.OVERVIEW, { signal });
    return parseOrThrow(dashboardOverviewSchema, data, 'dashboardService.getOverview');
  },
};
