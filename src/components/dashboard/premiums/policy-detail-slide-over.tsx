'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

type PolicyDetailSlideOverProps = {
  isOpen: boolean;
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function PolicyDetailSlideOver({
  isOpen,
  title,
  description,
  onClose,
  children,
}: PolicyDetailSlideOverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

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
        panel.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute('disabled') && element.tabIndex !== -1);

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
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
          key="policy-detail-slide-over-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] flex items-end justify-end bg-black/35 backdrop-blur-[1px] sm:items-stretch"
          onMouseDown={handleBackdropMouseDown}
          data-testid="policy-detail-slide-over-backdrop"
        >
          <motion.aside
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="policy-detail-slide-over-title"
            aria-describedby="policy-detail-slide-over-description"
            tabIndex={-1}
            initial={{ y: '12%', x: 0 }}
            animate={{ y: 0, x: 0 }}
            exit={{ y: '12%', x: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className={cn(
              'relative flex h-[94dvh] w-full flex-col overflow-y-auto bg-white px-5 pb-6 pt-6 shadow-2xl outline-none',
              'rounded-t-3xl sm:h-full sm:max-w-[42rem] sm:rounded-none sm:px-8 sm:pb-8 sm:pt-8',
            )}
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close policy details"
              className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>
            <header className="pr-14">
              <h2
                id="policy-detail-slide-over-title"
                className="break-words font-heading text-2xl font-bold leading-tight text-primary sm:text-3xl"
              >
                {title}
              </h2>
              <p
                id="policy-detail-slide-over-description"
                className="mt-2 break-words text-sm leading-6 text-primary-light"
              >
                {description}
              </p>
            </header>
            <div className="mt-7 min-w-0 flex-1">{children}</div>
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
