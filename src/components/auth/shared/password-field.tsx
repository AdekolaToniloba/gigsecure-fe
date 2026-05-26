'use client';

import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  id: string;
  error?: string;
  description?: string;
  hideLabel?: boolean;
  required?: boolean;
  inputClassName?: string;
};

const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      label,
      id,
      error,
      description,
      hideLabel = false,
      required,
      className,
      inputClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={cn('space-y-1.5', className)}>
        <label
          htmlFor={id}
          className={cn(
            'block text-xs font-semibold text-slate-900',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={isVisible ? 'text' : 'password'}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-4 pr-11 text-base text-slate-900 shadow-sm outline-none transition-colors sm:text-sm',
              'placeholder:text-slate-400',
              'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-muted',
              'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
              inputClassName
            )}
            {...props}
            autoCapitalize="none"
          />
          <button
            type="button"
            disabled={disabled}
            aria-label={isVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isVisible}
            onClick={() => setIsVisible((value) => !value)}
            className="absolute inset-y-0 right-2 inline-flex w-8 items-center justify-center rounded text-slate-400 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isVisible ? (
              <EyeOff aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Eye aria-hidden="true" className="h-4 w-4" />
            )}
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="text-xs text-slate-500">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordField.displayName = 'PasswordField';

export default PasswordField;
