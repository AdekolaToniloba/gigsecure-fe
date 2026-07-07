import Image from 'next/image';
import Link from 'next/link';
import { AppNavigation } from '@/components/dashboard/shell/app-navigation';
import { MarketplacePromoCard } from '@/components/dashboard/shell/marketplace-promo-card';
import { assetUrl, ASSETS } from '@/lib/assets';

type AppSidebarProps = {
  onNavigate?: () => void;
};

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto overscroll-contain pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-8">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        aria-label="GigSecure dashboard"
        className="ml-6 inline-flex min-h-11 w-fit touch-manipulation items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-app-sidebar"
      >
        <span className="relative block h-[30px] w-[166px]">
          <Image
            src={assetUrl(ASSETS.logo)}
            alt="GigSecure"
            width={194}
            height={35}
            className="h-[30px] w-[166px] object-contain object-left [filter:brightness(0)_saturate(100%)_invert(20%)_sepia(35%)_saturate(1518%)_hue-rotate(134deg)_brightness(89%)_contrast(103%)]"
            priority
          />
          <span
            aria-hidden="true"
            className="absolute bottom-[3px] right-0 h-1.5 w-1.5 rounded-full bg-accent"
          />
        </span>
      </Link>

      <div className="mt-14">
        <AppNavigation onNavigate={onNavigate} />
      </div>

      <div className="mx-8 mt-auto pt-10">
        <MarketplacePromoCard onNavigate={onNavigate} />
      </div>
    </div>
  );
}
