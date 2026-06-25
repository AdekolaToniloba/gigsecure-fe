'use client';

import { useMemo, useState } from 'react';
import {
  FilterSidebarShell,
  MobileFilterSheet,
} from '@/components/marketplace/filter-sidebar/filter-sidebar-shell';
import { MarketplaceNavbar } from '@/components/marketplace/marketplace-navbar';
import { ProductDetailPanel } from '@/components/marketplace/product-detail-panel';
import { ProductGrid } from '@/components/marketplace/product-grid';
import { MarketplaceRecommendationsAction } from '@/components/marketplace/recommendations/marketplace-recommendations-action';
import { RiskLevelFilter } from '@/components/marketplace/risk-level-filter';
import { useMarketplaceFilters } from '@/hooks/marketplace/useMarketplaceFilters';
import { useMarketplaceProducts } from '@/hooks/marketplace/useMarketplace';
import type { Product } from '@/types/marketplace';

const MARKETPLACE_PAGE_LIMIT = 8;

export function MarketplacePage() {
  const { filters } = useMarketplaceFilters();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const queryFilters = useMemo(
    () => ({
      ...filters,
      limit: filters.limit ?? MARKETPLACE_PAGE_LIMIT,
      offset: filters.offset ?? 0,
    }),
    [filters]
  );
  const { data, isLoading, isFetching, error, refetch } = useMarketplaceProducts(queryFilters);
  const visibleProducts = data?.items ?? [];
  const selectedProductId = selectedProduct?.id ?? null;

  return (
    <div className="w-full overflow-x-hidden bg-[#FCFCF8]">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <FilterSidebarShell products={visibleProducts} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MarketplaceNavbar />

          <main className="min-w-0 flex-1 px-4 pb-10 pt-5 sm:px-6 sm:pt-6 lg:px-10 lg:pt-8">
            <h1 className="sr-only">GigSecure Marketplace</h1>

            <div className="space-y-5 sm:space-y-6">
              <MobileFilterSheet products={visibleProducts} />

              <div className="hidden lg:block">
                <RiskLevelFilter />
              </div>

              <MarketplaceRecommendationsAction />

              <ProductGrid
                products={visibleProducts}
                isLoading={isLoading && visibleProducts.length === 0}
                isLoadingMore={isFetching && queryFilters.offset > 0}
                error={error}
                total={data?.total ?? visibleProducts.length}
                limit={queryFilters.limit}
                offset={queryFilters.offset}
                onOpenProduct={setSelectedProduct}
                onRetry={() => void refetch()}
              />
            </div>
          </main>
        </div>
      </div>

      <ProductDetailPanel
        isOpen={selectedProduct !== null}
        productId={selectedProductId}
        fallbackProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
