import { ShieldCheck } from 'lucide-react';

export function KycFormShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="mx-auto max-w-3xl" aria-labelledby="kyc-page-title">
      <div className="rounded-lg border border-primary/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <div className="mb-6 flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-muted text-primary">
            <ShieldCheck aria-hidden="true" className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary-light">
              Identity verification
            </p>
            <h1 id="kyc-page-title" className="mt-2 font-heading text-3xl font-bold text-primary">
              Complete KYC verification
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Verify your identity to unlock protected GigSecure actions.
            </p>
          </div>
        </div>

        {children}
      </div>
    </section>
  );
}
