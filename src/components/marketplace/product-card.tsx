'use client';

import { ShieldPlus } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import type { Product } from '@/types/marketplace';

type ProductCardProps = {
  product: Product;
  onOpen: (product: Product) => void;
};

function formatAmount(value: string) {
  return new Intl.NumberFormat('en-NG').format(Number(value));
}

function getProviderInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const [hasLogoError, setHasLogoError] = useState(false);
  const hasProviderLogo = Boolean(product.provider.logo_url) && !hasLogoError;

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(product);
    }
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open details for ${product.name}`}
      onClick={() => onOpen(product)}
      onKeyDown={handleKeyDown}
      className="min-w-0 rounded-2xl border border-primary/15 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F8EBCB] text-primary sm:h-14 sm:w-14">
          <ShieldPlus aria-hidden="true" className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>

        <div className="space-y-3">
          <h2 className="font-heading text-xl font-bold leading-6 text-primary sm:text-2xl sm:leading-7 xl:text-[1.85rem] xl:leading-8">
            {product.name}
          </h2>

          <div className="flex min-w-0 items-center gap-3">
            {hasProviderLogo ? (
              // Provider logos are partner-hosted and not yet configured for next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.provider.logo_url ?? ''}
                alt=""
                className="h-7 w-10 rounded object-contain"
                onError={() => setHasLogoError(true)}
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-7 w-10 items-center justify-center rounded bg-primary text-xs font-semibold text-white"
              >
                {getProviderInitials(product.provider.name)}
              </span>
            )}
            <span className="min-w-0 truncate text-sm font-medium text-primary">
              {product.provider.name}
            </span>
          </div>

          <p className="min-h-12 text-sm leading-6 text-primary-light [display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {product.description}
          </p>
        </div>
      </div>

      <div className="border-t border-primary/10 px-4 py-4 sm:px-5">
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div className="min-w-0">
            <dt className="text-primary-light">Coverage</dt>
            <dd className="mt-2 truncate font-semibold text-primary">
              {formatAmount(product.coverage_amount)}
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-primary-light">From</dt>
            <dd className="mt-2 truncate font-semibold text-primary">
              {formatAmount(product.premium_amount)}
              <span className="ml-1 text-sm font-medium text-primary">/month</span>
            </dd>
          </div>
        </dl>

        <Button
          type="button"
          variant="secondary"
          className="mt-5 w-full"
          onClick={(event) => {
            event.stopPropagation();
            onOpen(product);
          }}
        >
          Explore Plan <span aria-hidden="true" className="ml-2">→</span>
        </Button>
      </div>
    </article>
  );
}
