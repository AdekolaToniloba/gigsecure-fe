import Image from 'next/image';
import Link from 'next/link';
import { assetUrl, ASSETS } from '@/lib/assets';
import { APP_NAME } from '@/lib/constants';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  quote?: string;
  quoteAuthor?: string;
  showHeader?: boolean;
  showCancel?: boolean;
  showImageOverlay?: boolean;
  showQuote?: boolean;
  cancelHref?: string;
  className?: string;
};

export function AuthShell({
  children,
  imageSrc,
  imageAlt = '',
  quote = 'Never depend on a single income. Make investment to create a second source.',
  quoteAuthor = 'Warren Buffett',
  showHeader = true,
  showCancel = true,
  showImageOverlay = true,
  showQuote = true,
  cancelHref = '/',
  className,
}: AuthShellProps) {
  return (
    <section className={cn('min-h-screen bg-white text-slate-900', className)}>
      {showHeader && (
        <header className="flex h-14 items-center justify-between bg-primary px-7 text-white sm:px-10">
          <Link
            href="/"
            className="inline-flex items-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            aria-label={`${APP_NAME} home`}
          >
            <Image
              src={assetUrl(ASSETS.logo)}
              alt={APP_NAME}
              width={140}
              height={36}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          {showCancel && (
            <Link
              href={cancelHref}
              className="rounded-sm text-sm font-semibold text-white transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Cancel
            </Link>
          )}
        </header>
      )}

      <div
        className={cn(
          'grid lg:grid-cols-[minmax(17.5rem,38vw)_1fr]',
          showHeader ? 'min-h-[calc(100vh-3.5rem)]' : 'min-h-screen'
        )}
      >
        <aside className="relative hidden min-h-[33rem] overflow-hidden lg:block">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              sizes="38vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full w-full bg-primary" aria-hidden="true" />
          )}
          {showImageOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          )}
          {showQuote && (
            <figure className="absolute bottom-9 left-7 max-w-[17rem] text-white">
              <blockquote className="text-sm leading-5">{quote}</blockquote>
              <figcaption className="mt-3 text-sm font-bold">-{quoteAuthor}</figcaption>
            </figure>
          )}
        </aside>

        <div
          className={cn(
            'flex items-start justify-center px-6 py-12 sm:px-10 lg:items-center lg:py-10',
            showHeader ? 'min-h-[calc(100vh-3.5rem)]' : 'min-h-screen'
          )}
        >
          {children}
        </div>
      </div>
    </section>
  );
}

export function AuthFormPanel({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full max-w-[23rem]', className)}>
      <div className="mb-4">
        <h1 className="font-heading text-2xl font-bold leading-tight text-slate-900 sm:text-[1.65rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-sm leading-5 text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </div>
  );
}
