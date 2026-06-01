'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ShieldPlus, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useMarketplaceProduct } from '@/hooks/marketplace/useMarketplace';
import { parseApiError } from '@/lib/api/errors';
import { cn, formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/marketplace';
import Button from '../ui/Button';

type ProductDetailPanelProps = {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  fallbackProduct?: Product | null;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getCoverageBullets(description: string) {
  const bullets = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return bullets.length > 0 ? bullets : [description];
}

function getPayoutType(renewalFrequency: string) {
  switch (renewalFrequency.toLowerCase()) {
    case 'monthly':
      return 'Monthly Support';
    case 'quarterly':
      return 'Quarterly Support';
    case 'yearly':
    case 'annual':
      return 'Annual Support';
    default:
      return `${renewalFrequency.charAt(0).toUpperCase()}${renewalFrequency.slice(1)} Support`;
  }
}

export function ProductDetailPanel({
  isOpen,
  productId,
  onClose,
  fallbackProduct = null,
}: ProductDetailPanelProps) {
  const { data, isLoading, error, refetch } = useMarketplaceProduct(isOpen ? productId : null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const product = useMemo(() => {
    if (data) return data;
    if (!fallbackProduct) return null;
    return fallbackProduct.id === productId ? fallbackProduct : null;
  }, [data, fallbackProduct, productId]);
  const parsedError = error ? parseApiError(error) : null;
  const coverageBullets = product ? getCoverageBullets(product.description) : [];

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusableElements = Array.from(
        panel.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      if (focusableElements.length === 1) {
        event.preventDefault();
        focusableElements[0].focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  function handleBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="marketplace-product-panel-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-end justify-end bg-black/35 backdrop-blur-[1px] sm:items-stretch"
          onMouseDown={handleBackdropMouseDown}
          data-testid="marketplace-product-panel-backdrop"
        >
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketplace-product-panel-title"
            aria-describedby="marketplace-product-panel-description"
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className={cn(
              'relative flex h-[92dvh] w-full flex-col overflow-y-auto bg-white px-6 pb-6 pt-7 shadow-2xl focus:outline-none',
              'rounded-t-3xl sm:h-full sm:max-w-[42rem] sm:rounded-none sm:px-9 sm:pb-8 sm:pt-8'
            )}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close product details panel"
              className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            {!product && isLoading ? (
              <div className="flex min-h-[24rem] flex-col items-center justify-center gap-3 text-center">
                <p role="status" className="text-sm text-primary-light">
                  Loading plan details...
                </p>
              </div>
            ) : null}

            {!product && parsedError ? (
              <div className="flex min-h-[24rem] flex-col items-center justify-center gap-4 text-center">
                <p role="alert" className="text-sm text-primary-light">
                  {parsedError.message}
                </p>
                <Button type="button" onClick={() => void refetch()}>
                  Try again
                </Button>
              </div>
            ) : null}

            {product ? (
              <div className="flex flex-1 flex-col">
                <header className="pr-14">
                  <div className="flex items-start gap-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
                      <ShieldPlus aria-hidden="true" className="h-6 w-6" />
                    </span>
                    <div>
                      <h2
                        id="marketplace-product-panel-title"
                        className="font-heading text-3xl font-bold text-primary"
                      >
                        {product.name}
                      </h2>
                      <p className="mt-2 text-base text-primary-light">
                        Company: {product.provider.name} <span aria-hidden="true">•</span>{' '}
                        {product.category}
                      </p>
                    </div>
                  </div>
                </header>

                <section className="mt-8 rounded-2xl border border-primary/10 bg-[#F2F7F7] px-5 py-6 sm:px-7">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <h3 className="text-sm font-medium text-primary">{product.category} up to</h3>
                      <p className="mt-3 font-heading text-4xl font-bold text-primary">
                        {new Intl.NumberFormat('en-NG').format(Number(product.coverage_amount))}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-primary">From</h3>
                      <p className="mt-3 font-heading text-4xl font-bold text-primary">
                        {new Intl.NumberFormat('en-NG').format(Number(product.premium_amount))}
                        <span className="ml-2 text-base font-medium text-primary-light">/ month</span>
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-primary">Renewal</h3>
                      <p className="mt-3 font-heading text-4xl font-bold text-primary">
                        {product.renewal_frequency.charAt(0).toUpperCase()}
                        {product.renewal_frequency.slice(1)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="font-heading text-2xl font-bold text-primary">Description</h3>
                  <p
                    id="marketplace-product-panel-description"
                    className="mt-4 text-base leading-8 text-primary-light"
                  >
                    {product.description}
                  </p>
                </section>

                <section className="mt-8">
                  <h3 className="font-heading text-2xl font-bold text-primary">
                    What this plan covers
                  </h3>
                  <ul className="mt-5 space-y-4 text-base leading-8 text-primary-light">
                    {coverageBullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span aria-hidden="true" className="mt-3 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-8 rounded-2xl border border-primary/10 bg-[#F2F7F7] px-5 py-6 sm:px-7">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-primary">Coverage Limit</h3>
                      <p className="mt-3 text-2xl font-semibold text-primary">
                        {formatCurrency(Number(product.coverage_amount), product.premium_currency)}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-primary">Payout Type</h3>
                      <p className="mt-3 text-2xl font-semibold text-primary">
                        {getPayoutType(product.renewal_frequency)}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="mt-8">
                  <h3 className="font-heading text-2xl font-bold text-primary">
                    Policy and document
                  </h3>
                  <p className="mt-4 text-base leading-8 text-primary-light">
                    View and download your policy documents once marketplace purchase flows are available.
                  </p>
                </section>

                <div className="mt-auto pt-10">
                  <Button
                    type="button"
                    disabled
                    className="h-14 w-full rounded-2xl text-base"
                    aria-describedby="marketplace-product-panel-cta-note"
                  >
                    Get Covered
                  </Button>
                  <p
                    id="marketplace-product-panel-cta-note"
                    className="mt-3 text-sm text-primary-light"
                  >
                    Marketplace purchase flow is coming soon.
                  </p>
                </div>
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
