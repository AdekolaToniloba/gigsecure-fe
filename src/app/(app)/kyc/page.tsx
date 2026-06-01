import type { Metadata } from 'next';
import { KycPageContent } from '@/components/kyc/kyc-page';
import { KycRouteController } from '@/components/kyc/kyc-route-controller';

export const metadata: Metadata = {
  title: 'KYC Verification | GigSecure',
  description:
    'Complete NIN identity verification to unlock protected GigSecure features and recommendations.',
};

export default function KycPage() {
  return (
    <KycRouteController>
      <KycPageContent />
    </KycRouteController>
  );
}
