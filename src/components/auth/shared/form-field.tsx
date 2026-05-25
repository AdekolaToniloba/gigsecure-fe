import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
  description?: string;
  icon?: React.ReactNode;
  hideLabel?: boolean;
  required?: boolean;
  inputClassName?: string;
};

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  (
    {
      label,
      id,
      error,
      description,
      icon,
      hideLabel = false,
      required,
      className,
      inputClassName,
      disabled,
      ...props
    },
    ref
  ) => {
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
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'h-9 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 shadow-sm outline-none transition',
              'placeholder:text-xs placeholder:text-slate-400',
              'focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-muted',
              'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
              icon && 'pr-10',
              error && 'border-red-400 focus:border-red-500 focus:ring-red-100',
              inputClassName
            )}
            {...props}
          />
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400"
            >
              {icon}
            </span>
          )}
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

FormField.displayName = 'FormField';

export default FormField;
