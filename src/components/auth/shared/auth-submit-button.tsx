import { forwardRef, type ButtonHTMLAttributes } from 'react';
import Spinner from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

type AuthSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading?: boolean;
  loadingLabel?: string;
};

const AuthSubmitButton = forwardRef<HTMLButtonElement, AuthSubmitButtonProps>(
  (
    {
      children,
      isLoading = false,
      loadingLabel = 'Please wait…',
      disabled,
      className,
      type = 'submit',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-bold text-slate-950 shadow-sm transition-colors duration-150',
          'hover:bg-accent-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-alt focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        {...props}
      >
        {isLoading && <Spinner size="sm" color="currentColor" aria-hidden="true" />}
        <span>{isLoading ? loadingLabel : children}</span>
      </button>
    );
  }
);

AuthSubmitButton.displayName = 'AuthSubmitButton';

export default AuthSubmitButton;
