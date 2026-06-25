import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { marketplaceService } from '@/services/marketplace.service';
import type { MarketplaceFilters } from '@/lib/validators/marketplace';

export function useMarketplaceProducts(filters: MarketplaceFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.MARKETPLACE_PRODUCTS(filters),
    queryFn: ({ signal }) => marketplaceService.listProducts(filters, signal),
  });
}

export function useMarketplaceProduct(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.MARKETPLACE_PRODUCT(id ?? ''),
    queryFn: ({ signal }) => marketplaceService.getProduct(id as string, signal),
    enabled: Boolean(id),
  });
}

export function useMarketplaceRecommendations(perCategory = 3, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.MARKETPLACE_RECOMMENDATIONS(perCategory),
    queryFn: ({ signal }) => marketplaceService.getRecommendations(perCategory, signal),
    enabled,
  });
}
