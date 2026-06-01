import Button from '@/components/ui/Button';

type KycRetryPanelProps = {
  status: 'rejected' | 'failed';
  reason?: string | null;
  cooldownRemainingMs: number;
  onRetry?: () => void;
};

function formatCooldown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export function KycRetryPanel({
  status,
  reason,
  cooldownRemainingMs,
  onRetry,
}: KycRetryPanelProps) {
  const isCoolingDown = cooldownRemainingMs > 0;
  const title =
    status === 'rejected'
      ? 'Details did not match records'
      : 'Verification could not be completed';
  const body =
    status === 'rejected'
      ? `${reason || 'The details submitted did not match identity records.'} Double-check your NIN slip or NIMC card before trying again.`
      : `${reason || 'Verification could not be completed due to a technical or provider issue.'} This is not caused by your details. Please try again after the cooldown.`;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-6">{body}</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" onClick={onRetry} disabled={isCoolingDown}>
          Try again
        </Button>
        {isCoolingDown ? (
          <p role="status" aria-live="polite" className="text-sm">
            Retry available in {formatCooldown(cooldownRemainingMs)}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
