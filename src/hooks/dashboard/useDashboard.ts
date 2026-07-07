import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { dashboardService } from '@/services/dashboard.service';

export const DASHBOARD_OVERVIEW_STALE_TIME = 2 * 60 * 1000;

type DashboardOverviewQueryOptions = {
  enabled?: boolean;
};

export function useDashboardOverview(
  { enabled = true }: DashboardOverviewQueryOptions = {},
) {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_OVERVIEW,
    queryFn: ({ signal }) => dashboardService.getOverview(signal),
    enabled,
    staleTime: DASHBOARD_OVERVIEW_STALE_TIME,
    retry: false,
    refetchOnWindowFocus: false,
    throwOnError: false,
  });
}
