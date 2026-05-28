import type { Metadata } from 'next';
import { KycRouteController } from '@/components/kyc/kyc-route-controller';

export const metadata: Metadata = {
  title: 'KYC Verification | GigSecure',
  description: 'Complete identity verification to continue using protected GigSecure features.',
};

export default function KycPage() {
  return (
    <KycRouteController>
      <section className="mx-auto max-w-3xl">
        <div className="rounded-lg border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary-light">
            Identity verification
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold text-primary">
            Complete KYC verification
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Verify your identity to unlock protected GigSecure actions.
          </p>
        </div>
      </section>
    </KycRouteController>
  );
}
