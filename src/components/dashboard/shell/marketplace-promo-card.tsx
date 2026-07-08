import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type MarketplacePromoCardProps = {
  onNavigate?: () => void;
};

export function MarketplacePromoCard({ onNavigate }: MarketplacePromoCardProps) {
  return (
    <section
      aria-labelledby="marketplace-promo-title"
      className="relative overflow-hidden rounded-2xl border border-accent-alt bg-[#fff9d9] px-5 pb-5 pt-8 text-primary shadow-sm"
    >
      <h2 id="marketplace-promo-title" className="text-center font-heading text-base font-bold leading-tight">
        Explore Marketplace
      </h2>
      <p className="mt-2 text-center text-xs font-semibold leading-5 text-primary-light">
        Discover insurance plans that fit in your needs and budget.
      </p>
      <Image
        src="/assets/images/dashboard-marketplace-promo.webp"
        alt="Umbrella and shield representing insurance protection"
        width={480}
        height={320}
        sizes="(min-width: 1024px) 200px, 176px"
        className="mx-auto mt-3 h-32 w-full rounded-xl object-cover"
      />
      <Link
        href="/marketplace"
        onClick={onNavigate}
        className="mt-4 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-primary transition-colors hover:bg-accent-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#fff9d9]"
      >
        Explore marketplace
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </section>
  );
}
