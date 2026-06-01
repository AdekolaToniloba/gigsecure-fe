'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { MarketplaceFilters } from '@/lib/validators/marketplace';

export const MAX_MARKETPLACE_PREMIUM = 50_000;

export type MarketplaceSidebarFilters = Pick<
  MarketplaceFilters,
  'category' | 'provider_slug' | 'max_premium'
>;

const MARKETPLACE_FILTER_KEYS = [
  'category',
  'provider_slug',
  'risk_level',
  'q',
  'min_premium',
  'max_premium',
  'limit',
  'offset',
] as const;

function readOptionalNumber(searchParams: URLSearchParams, key: string) {
  const value = searchParams.get(key);
  if (value === null || value === '') return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function readMarketplaceFilters(searchParams: URLSearchParams): MarketplaceFilters {
  const category = searchParams.getAll('category');
  const providerSlug = searchParams.getAll('provider_slug');
  const riskLevel = searchParams.getAll('risk_level');
  const q = searchParams.get('q')?.trim();

  return {
    category: category.length > 0 ? category : undefined,
    provider_slug: providerSlug.length > 0 ? providerSlug : undefined,
    risk_level: riskLevel.length > 0 ? riskLevel : undefined,
    q: q || undefined,
    min_premium: readOptionalNumber(searchParams, 'min_premium'),
    max_premium: readOptionalNumber(searchParams, 'max_premium'),
    limit: readOptionalNumber(searchParams, 'limit'),
    offset: readOptionalNumber(searchParams, 'offset'),
  };
}

function appendValues(params: URLSearchParams, key: string, values?: string[]) {
  values?.forEach((value) => params.append(key, value));
}

export function writeMarketplaceFilters(
  currentSearchParams: URLSearchParams,
  filters: MarketplaceFilters
) {
  const params = new URLSearchParams(currentSearchParams.toString());
  MARKETPLACE_FILTER_KEYS.forEach((key) => params.delete(key));

  appendValues(params, 'category', filters.category);
  appendValues(params, 'provider_slug', filters.provider_slug);
  appendValues(params, 'risk_level', filters.risk_level);

  if (filters.q) params.set('q', filters.q);
  if (filters.min_premium !== undefined) params.set('min_premium', String(filters.min_premium));
  if (filters.max_premium !== undefined) params.set('max_premium', String(filters.max_premium));
  if (filters.limit !== undefined) params.set('limit', String(filters.limit));
  if (filters.offset !== undefined && filters.offset > 0) params.set('offset', String(filters.offset));

  return params;
}

export function useMarketplaceFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => readMarketplaceFilters(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const replaceFilters = useCallback(
    (nextFilters: MarketplaceFilters) => {
      const params = writeMarketplaceFilters(
        new URLSearchParams(searchParams.toString()),
        nextFilters
      );
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const applySidebarFilters = useCallback(
    (sidebarFilters: MarketplaceSidebarFilters) => {
      replaceFilters({
        ...filters,
        category: sidebarFilters.category,
        provider_slug: sidebarFilters.provider_slug,
        max_premium:
          sidebarFilters.max_premium === MAX_MARKETPLACE_PREMIUM
            ? undefined
            : sidebarFilters.max_premium,
        offset: 0,
      });
    },
    [filters, replaceFilters]
  );

  const clearFilters = useCallback(() => replaceFilters({}), [replaceFilters]);

  const updateSearch = useCallback(
    (q: string) => {
      const normalizedQuery = q.trim();
      if ((filters.q ?? '') === normalizedQuery) return;

      replaceFilters({
        ...filters,
        q: normalizedQuery || undefined,
        offset: 0,
      });
    },
    [filters, replaceFilters]
  );

  const updateRiskLevel = useCallback(
    (riskLevel?: string) => {
      replaceFilters({
        ...filters,
        risk_level: riskLevel ? [riskLevel] : undefined,
        offset: 0,
      });
    },
    [filters, replaceFilters]
  );

  return {
    filters,
    applySidebarFilters,
    clearFilters,
    updateSearch,
    updateRiskLevel,
  };
}
