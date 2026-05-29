import { Loader2 } from 'lucide-react';

type KycPendingStateProps = {
  hasTimedOut: boolean;
};

export function KycPendingState({ hasTimedOut }: KycPendingStateProps) {
  if (hasTimedOut) {
    return (
      <div role="status" aria-live="polite" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Verification is taking longer than expected</p>
        <p className="mt-1 leading-6">
          Your verification is still pending. You can check back later; we have stopped polling for now.
        </p>
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" className="rounded-lg border border-primary-muted bg-primary-muted p-4 text-sm text-primary">
      <div className="flex gap-3">
        <Loader2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 animate-spin" />
        <div>
          <p className="font-semibold">Verification in progress</p>
          <p className="mt-1 leading-6">
            We are checking your identity details. This usually resolves quickly, but may take longer when the provider is busy.
          </p>
        </div>
      </div>
    </div>
  );
}
