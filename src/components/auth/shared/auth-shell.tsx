import Image from 'next/image';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  quote?: string;
  quoteAuthor?: string;
  showCancel?: boolean;
  cancelHref?: string;
  className?: string;
};

export function AuthShell({
  children,
  imageSrc,
  imageAlt = '',
  quote = 'Never depend on a single income. Make investment to create a second source.',
  quoteAuthor = 'Warren Buffett',
  showCancel = true,
  cancelHref = '/',
  className,
}: AuthShellProps) {
  return (
    <section className={cn('min-h-screen bg-white text-slate-900', className)}>
      <header className="flex h-14 items-center justify-between bg-primary px-7 text-white sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-sm font-heading text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          aria-label="GigSecure home"
        >
          <Shield aria-hidden="true" className="h-5 w-5" />
          <span>
            GigSecure<span className="text-accent">.</span>
          </span>
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

      <div className="grid min-h-[calc(100vh-3.5rem)] lg:grid-cols-[minmax(17.5rem,38vw)_1fr]">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <figure className="absolute bottom-9 left-7 max-w-[17rem] text-white">
            <blockquote className="text-sm leading-5">{quote}</blockquote>
            <figcaption className="mt-3 text-sm font-bold">-{quoteAuthor}</figcaption>
          </figure>
        </aside>

        <div className="flex min-h-[calc(100vh-3.5rem)] items-start justify-center px-6 py-12 sm:px-10 lg:items-center lg:py-10">
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
