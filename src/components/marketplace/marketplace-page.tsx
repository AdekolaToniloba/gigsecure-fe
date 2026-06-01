'use client';

import { useMemo, useState } from 'react';
import { FilterSidebarShell } from '@/components/marketplace/filter-sidebar/filter-sidebar-shell';
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
    <div className="w-full bg-[#FCFCF8]">
      <div className="flex min-h-screen w-full">
        <FilterSidebarShell products={visibleProducts} />

        <div className="flex min-w-0 flex-1 flex-col">
          <MarketplaceNavbar />

          <main className="flex-1 px-6 pb-10 pt-8 sm:px-8 lg:px-10">
            <h1 className="sr-only">GigSecure Marketplace</h1>

            <div className="space-y-6">
              <RiskLevelFilter />

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
