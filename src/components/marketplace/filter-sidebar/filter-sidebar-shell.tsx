'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useUserFlags } from '@/hooks/auth/useUserFlags';
import {
  MAX_MARKETPLACE_PREMIUM,
  type MarketplaceSidebarFilters,
  useMarketplaceFilters,
} from '@/hooks/marketplace/useMarketplaceFilters';
import { assetUrl, ASSETS } from '@/lib/assets';
import type { Product, ProviderRef } from '@/types/marketplace';
import { RiskLevelFilter } from '../risk-level-filter';
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

export function MobileFilterSheet({ products }: FilterSidebarShellProps) {
  const { filters } = useMarketplaceFilters();
  const { riskAssessed } = useUserFlags();
  const facets = useMemo(() => deriveFacets(products), [products]);
  const appliedFiltersKey = JSON.stringify([
    filters.category,
    filters.provider_slug,
    filters.max_premium,
  ]);
  const appliedFilterCount = getAppliedFilterCount(filters);

  return (
    <MobileFilterSheetContent
      key={appliedFiltersKey}
      facets={facets}
      initialFilters={createPendingFilters(
        filters.category,
        filters.provider_slug,
        filters.max_premium
      )}
      appliedFilterCount={appliedFilterCount}
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
    <aside className="hidden w-72 shrink-0 flex-col border-r border-primary/10 bg-white px-6 py-8 lg:flex lg:min-h-screen">
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
        <FilterFields
          facets={facets}
          pendingFilters={pendingFilters}
          setPendingFilters={setPendingFilters}
        />
        <ApplyFiltersButton onClick={() => applySidebarFilters(pendingFilters)} />
      </div>

      {showRiskAssessmentPrompt ? (
        <div className="pt-6 lg:mt-auto lg:pt-10">
          <RiskAssessmentPrompt />
        </div>
      ) : null}
    </aside>
  );
}

type MobileFilterSheetContentProps = FilterSidebarContentProps & {
  appliedFilterCount: number;
};

function MobileFilterSheetContent({
  facets,
  initialFilters,
  appliedFilterCount,
  showRiskAssessmentPrompt,
}: MobileFilterSheetContentProps) {
  const { applySidebarFilters, clearFilters } = useMarketplaceFilters();
  const [pendingFilters, setPendingFilters] = useState(() => initialFilters);
  const [isOpen, setIsOpen] = useState(false);
  const buttonLabel = appliedFilterCount > 0 ? `Filters(${appliedFilterCount})` : 'Filters';

  function clearAll() {
    setPendingFilters(createPendingFilters());
    clearFilters();
  }

  function applyFilters() {
    applySidebarFilters(pendingFilters);
    setIsOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-label={appliedFilterCount > 0 ? buttonLabel : 'Filters +'}
        className="inline-flex h-11 w-full items-center justify-between rounded-lg border border-primary/15 bg-white px-4 text-sm font-semibold text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span>{buttonLabel}</span>
        {appliedFilterCount === 0 ? (
          <span aria-hidden="true" className="text-lg leading-none">
            +
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="marketplace-mobile-filters"
            className="fixed inset-0 z-[110] flex items-end bg-black/45"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="marketplace-mobile-filters-title"
              className="max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-primary/10 bg-white px-5 py-5">
                <h2
                  id="marketplace-mobile-filters-title"
                  className="font-heading text-lg font-bold text-primary"
                >
                  Filters
                </h2>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close filters"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <X aria-hidden="true" className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-7 px-5 py-5">
                <section aria-labelledby="marketplace-mobile-risk-filter-title">
                  <h3
                    id="marketplace-mobile-risk-filter-title"
                    className="font-heading text-sm font-bold text-primary"
                  >
                    Risk level
                  </h3>
                  <div className="mt-3">
                    <RiskLevelFilter />
                  </div>
                </section>

                <FilterFields
                  facets={facets}
                  pendingFilters={pendingFilters}
                  setPendingFilters={setPendingFilters}
                />

                {showRiskAssessmentPrompt ? <RiskAssessmentPrompt /> : null}
              </div>

              <div className="sticky bottom-0 grid gap-3 border-t border-primary/10 bg-white px-5 py-4">
                <ApplyFiltersButton onClick={applyFilters} />
                <button
                  type="button"
                  onClick={clearAll}
                  className="h-10 rounded-lg border border-primary/15 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type FilterFieldsProps = {
  facets: ReturnType<typeof deriveFacets>;
  pendingFilters: MarketplaceSidebarFilters;
  setPendingFilters: Dispatch<SetStateAction<MarketplaceSidebarFilters>>;
};

function FilterFields({ facets, pendingFilters, setPendingFilters }: FilterFieldsProps) {
  return (
    <>
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
    </>
  );
}

function getAppliedFilterCount(filters: ReturnType<typeof useMarketplaceFilters>['filters']) {
  return (
    (filters.category?.length ?? 0) +
    (filters.provider_slug?.length ?? 0) +
    (filters.risk_level?.length ?? 0) +
    (filters.min_premium !== undefined ? 1 : 0) +
    (filters.max_premium !== undefined ? 1 : 0)
  );
}
