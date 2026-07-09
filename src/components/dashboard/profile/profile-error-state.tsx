import Button from '@/components/ui/Button';

type ProfileErrorStateProps = {
  title?: string;
  message: string;
  actionLabel?: string;
  onRetry?: () => void;
};

export function ProfileErrorState({
  title = 'Profile unavailable',
  message,
  actionLabel = 'Try again',
  onRetry,
}: ProfileErrorStateProps) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm" aria-labelledby="profile-error-title">
      <h2 id="profile-error-title" className="font-heading text-xl font-bold text-primary">
        {title}
      </h2>
      <p role="alert" className="mt-3 text-sm leading-6 text-slate-600">
        {message}
      </p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry} className="mt-5 min-h-11">
          {actionLabel}
        </Button>
      ) : null}
    </section>
  );
}
