'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import {
  MAX_MARKETPLACE_PREMIUM,
  type MarketplaceSidebarFilters,
  useMarketplaceFilters,
} from '@/hooks/marketplace/useMarketplaceFilters';
import { assetUrl, ASSETS } from '@/lib/assets';
import type { Product, ProviderRef } from '@/types/marketplace';
import { ApplyFiltersButton } from './apply-filters-button';
import { CategoryFilter } from './category-filter';
import { PriceRangeFilter } from './price-range-filter';
import { ProviderFilter } from './provider-filter';
import { RiskAssessmentPrompt } from './risk-assessment-prompt';

type FilterSidebarShellProps = {
  products: Product[];
};

function deriveFacets(products: Product[]) {
  const categories = new Set<string>();
  const providers = new Map<string, ProviderRef>();

  products.forEach((product) => {
    categories.add(product.category);
    providers.set(product.provider.slug, product.provider);
  });

  return {
    categories: [...categories],
    providers: [...providers.values()],
  };
}

function createPendingFilters(
  category?: string[],
  providerSlug?: string[],
  maximumPremium?: number
): MarketplaceSidebarFilters {
  return {
    category: category ?? [],
    provider_slug: providerSlug ?? [],
    max_premium: maximumPremium ?? MAX_MARKETPLACE_PREMIUM,
  };
}

export function FilterSidebarShell({ products }: FilterSidebarShellProps) {
  const { filters } = useMarketplaceFilters();
  const { riskAssessed } = useUserFlags();
  const facets = useMemo(() => deriveFacets(products), [products]);
  const appliedFiltersKey = JSON.stringify([
    filters.category,
    filters.provider_slug,
    filters.max_premium,
  ]);

  return (
    <FilterSidebarContent
      key={appliedFiltersKey}
      facets={facets}
      initialFilters={createPendingFilters(
        filters.category,
        filters.provider_slug,
        filters.max_premium
      )}
      showRiskAssessmentPrompt={riskAssessed === false}
    />
  );
}

type FilterSidebarContentProps = {
  facets: ReturnType<typeof deriveFacets>;
  initialFilters: MarketplaceSidebarFilters;
  showRiskAssessmentPrompt: boolean;
};

function FilterSidebarContent({
  facets,
  initialFilters,
  showRiskAssessmentPrompt,
}: FilterSidebarContentProps) {
  const { applySidebarFilters, clearFilters } = useMarketplaceFilters();
  const [pendingFilters, setPendingFilters] = useState(() =>
    initialFilters
  );

  function clearAll() {
    setPendingFilters(createPendingFilters());
    clearFilters();
  }

  return (
    <aside className="flex min-h-screen w-72 shrink-0 flex-col border-r border-primary/10 bg-white px-6 py-8">
      <Image
        src={assetUrl(ASSETS.logo)}
        alt="GigSecure"
        width={160}
        height={40}
        className="h-8 w-auto self-start object-contain"
      />

      <div className="mt-8 flex items-center justify-between border-b border-primary/15 pb-3">
        <h1 className="font-heading text-base font-bold text-primary">Filters</h1>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Clear all
        </button>
      </div>

      <div className="mt-5 space-y-7 px-3">
        <CategoryFilter
          categories={facets.categories}
          selected={pendingFilters.category ?? []}
          onChange={(category) => setPendingFilters((current) => ({ ...current, category }))}
        />
        <PriceRangeFilter
          maximumPremium={pendingFilters.max_premium ?? MAX_MARKETPLACE_PREMIUM}
          onChange={(max_premium) => setPendingFilters((current) => ({ ...current, max_premium }))}
        />
        <ProviderFilter
          providers={facets.providers}
          selected={pendingFilters.provider_slug ?? []}
          onChange={(provider_slug) =>
            setPendingFilters((current) => ({ ...current, provider_slug }))
          }
        />
        <ApplyFiltersButton onClick={() => applySidebarFilters(pendingFilters)} />
      </div>

      {showRiskAssessmentPrompt ? (
        <div className="mt-auto pt-10">
          <RiskAssessmentPrompt />
        </div>
      ) : null}
    </aside>
  );
}
