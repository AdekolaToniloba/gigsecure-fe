import Button from './Button';

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

export default function ErrorFallback({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onReset,
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-muted">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#004E4C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold text-primary">
          {title}
        </h2>
        <p className="text-sm text-primary-light">{message}</p>
      </div>

      {onReset && (
        <Button variant="primary" size="md" onClick={onReset}>
          Try again
        </Button>
      )}
    </div>
  );
}
