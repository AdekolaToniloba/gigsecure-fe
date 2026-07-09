'use client';

import Link from 'next/link';
import { useId, useState } from 'react';
import { ProductCard } from '@/components/marketplace/product-card';
import { ProductCardSkeleton } from '@/components/marketplace/product-card-skeleton';
import { ProductDetailPanel } from '@/components/marketplace/product-detail-panel';
import Button from '@/components/ui/Button';
import { useMarketplaceRecommendations } from '@/hooks/marketplace/useMarketplace';
import { parseApiError } from '@/lib/api/errors';
import type { Product } from '@/types/marketplace';

const RECOMMENDATIONS_PER_CATEGORY = 3;

export function RecommendedProducts() {
  const recommendations = useMarketplaceRecommendations(RECOMMENDATIONS_PER_CATEGORY);
  const titleId = useId();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const selectedProductId = selectedProduct?.id ?? null;
  const products = recommendations.data?.items ?? [];

  return (
    <section aria-labelledby={titleId} className="mt-8 min-w-0">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 id={titleId} className="font-heading text-2xl font-bold text-primary">
            Recommended for you
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-light sm:text-base">
            Protection plans matched to your latest risk assessment.
          </p>
        </div>
        {recommendations.isSuccess && products.length > 0 ? (
          <Link
            href="/marketplace"
            className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-primary underline-offset-4 outline-none hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Browse all plans
          </Link>
        ) : null}
      </div>

      {recommendations.isPending ? (
        <div role="status" aria-label="Loading recommended plans" className="mt-6">
          <span className="sr-only">Loading recommended plans…</span>
          <div
            aria-hidden="true"
            className="grid min-w-0 grid-cols-1 gap-4 motion-reduce:[&_*]:animate-none sm:grid-cols-2 xl:grid-cols-3"
          >
            {Array.from({ length: RECOMMENDATIONS_PER_CATEGORY }, (_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        </div>
      ) : null}

      {recommendations.isError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
          <h4 className="font-heading text-lg font-bold text-primary">Recommended plans unavailable</h4>
          <p className="mt-2 max-w-2xl break-words text-sm leading-6 text-slate-600 [overflow-wrap:anywhere]">
            {parseApiError(recommendations.error).message}
          </p>
          <Button
            type="button"
            onClick={() => void recommendations.refetch()}
            isLoading={recommendations.isFetching}
            className="mt-4 min-h-11"
          >
            Try again
          </Button>
        </div>
      ) : null}

      {recommendations.isSuccess && products.length === 0 ? (
        <div role="status" className="mt-6 rounded-2xl border border-app-border bg-white p-6 shadow-sm">
          <h4 className="font-heading text-lg font-bold text-primary">No recommended plans yet</h4>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            We do not have a personalized marketplace match for this assessment right now.
          </p>
          <Link
            href="/marketplace"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary outline-none transition-colors hover:bg-primary-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Browse marketplace
          </Link>
        </div>
      ) : null}

      {recommendations.isSuccess && products.length > 0 ? (
        <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              headingLevel="h4"
              onOpen={setSelectedProduct}
            />
          ))}
        </div>
      ) : null}

      <ProductDetailPanel
        isOpen={selectedProduct !== null}
        productId={selectedProductId}
        fallbackProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
