'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppSidebar } from '@/components/dashboard/shell/app-sidebar';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function MobileNavigationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const closeDrawer = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : triggerRef.current;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
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
  }, [closeDrawer, isOpen]);

  function handleBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      closeDrawer();
    }
  }

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="mobile-app-navigation"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 w-11 touch-manipulation items-center justify-center rounded-lg border border-app-border bg-white text-primary shadow-sm transition-colors hover:bg-app-sidebar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <Menu aria-hidden="true" className="h-6 w-6" />
      </button>

      <span className="sr-only" role="status" aria-live="polite">
        {isOpen ? 'Navigation menu opened' : ''}
      </span>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[130] flex bg-black/50 motion-reduce:transition-none"
          onMouseDown={handleBackdropMouseDown}
          data-testid="mobile-navigation-backdrop"
        >
          <div
            ref={dialogRef}
            id="mobile-app-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-navigation-title"
            tabIndex={-1}
            className="relative h-dvh w-[min(18.625rem,calc(100vw-2rem))] max-w-full overscroll-contain bg-app-sidebar shadow-2xl outline-none motion-reduce:transition-none"
          >
            <h2 id="mobile-navigation-title" className="sr-only">
              Application navigation
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDrawer}
              aria-label="Close navigation menu"
              className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-primary transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-sidebar"
            >
              <X aria-hidden="true" className="h-5 w-5" />
            </button>

            <AppSidebar onNavigate={closeDrawer} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
