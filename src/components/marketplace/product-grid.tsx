'use client';

import { parseApiError } from '@/lib/api/errors';
import type { Product } from '@/types/marketplace';
import Button from '../ui/Button';
import { ProductCard } from './product-card';
import { ProductCardSkeleton } from './product-card-skeleton';

type ProductGridProps = {
  products: Product[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  error?: unknown;
  total?: number;
  limit?: number;
  offset?: number;
  onOpenProduct: (product: Product) => void;
  onRetry?: () => void;
  onLoadMore?: () => void;
};

export function ProductGrid({
  products,
  isLoading = false,
  isLoadingMore = false,
  error,
  total = 0,
  limit = 20,
  offset = 0,
  onOpenProduct,
  onRetry,
  onLoadMore,
}: ProductGridProps) {
  const parsedError = error ? parseApiError(error) : null;
  const hasMore = offset + products.length < total || products.length === limit;

  if (isLoading) {
    return (
      <section aria-label="Marketplace products" className="space-y-4">
        <p role="status" className="text-sm text-primary-light">
          Loading marketplace plans...
        </p>
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (parsedError) {
    return (
      <section
        aria-label="Marketplace products"
        className="rounded-2xl border border-primary/15 bg-white p-6 text-center sm:p-8"
      >
        <p role="alert" className="text-sm text-primary-light">
          {parsedError.message}
        </p>
        {onRetry ? (
          <Button type="button" className="mt-4" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section
        aria-label="Marketplace products"
        className="rounded-2xl border border-primary/15 bg-white p-6 text-center sm:p-8"
      >
        <p role="status" className="text-sm text-primary-light">
          No products match your current filters.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Marketplace products" className="space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onOpen={onOpenProduct} />
        ))}
      </div>

      {onLoadMore && hasMore ? (
        <div className="flex flex-col items-center gap-3">
          {isLoadingMore ? (
            <p role="status" className="text-sm text-primary-light">
              Loading more plans...
            </p>
          ) : null}
          <Button type="button" onClick={onLoadMore} isLoading={isLoadingMore}>
            {isLoadingMore ? 'Loading more...' : 'Load more'}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
