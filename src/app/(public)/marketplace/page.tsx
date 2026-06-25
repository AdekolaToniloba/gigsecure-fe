import type { Metadata } from 'next';
import { MarketplacePage } from '@/components/marketplace/marketplace-page';

export const metadata: Metadata = {
  title: 'Marketplace | GigSecure',
  description: 'Browse public insurance plans tailored for Nigeria’s gig workers.',
};

export default function PublicMarketplaceRoute() {
  return <MarketplacePage />;
}
