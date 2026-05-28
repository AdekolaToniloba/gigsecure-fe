'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type KycRequiredModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  ctaLabel?: string;
  kycHref?: string;
  returnTo?: string;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function buildKycHref(kycHref: string, returnTo?: string) {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) return kycHref;

  const separator = kycHref.includes('?') ? '&' : '?';
  return `${kycHref}${separator}redirect=${encodeURIComponent(returnTo)}`;
}

export function KycRequiredModal({
  isOpen,
  onClose,
  title = 'KYC verification required',
  description = 'Complete KYC verification before continuing with this action.',
  ctaLabel = 'Go to KYC',
  kycHref = '/kyc',
  returnTo,
}: KycRequiredModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const targetHref = useMemo(() => buildKycHref(kycHref, returnTo), [kycHref, returnTo]);

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

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector)
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
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

  if (!isOpen) return null;

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  function handleCtaClick() {
    router.push(targetHref);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={handleBackdropClick}
      data-testid="kyc-required-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-required-title"
        aria-describedby="kyc-required-description"
        tabIndex={-1}
        className={cn(
          'relative w-full max-w-md rounded-lg bg-white p-6 shadow-2xl',
          'focus:outline-none sm:p-7'
        )}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close KYC required dialog"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-muted text-primary">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>

        <div className="pr-8">
          <h2 id="kyc-required-title" className="font-heading text-2xl font-bold text-primary">
            {title}
          </h2>
          <p id="kyc-required-description" className="mt-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button type="button" onClick={handleCtaClick}>
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
