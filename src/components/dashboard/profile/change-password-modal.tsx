'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import PasswordField from '@/components/auth/shared/password-field';
import Button from '@/components/ui/Button';
import { useChangePassword } from '@/hooks/auth/useAuth';
import { parseApiError } from '@/lib/api/errors';
import { changePasswordFormSchema } from '@/lib/validators/auth';
import type { ChangePasswordFormInput, ChangePasswordFormOutput } from '@/types/auth';

const focusableSelector = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type ChangePasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess,
}: ChangePasswordModalProps) {
  const changePassword = useChangePassword();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const form = useForm<ChangePasswordFormInput, unknown, ChangePasswordFormOutput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedRef.current?.focus();
    };
  }, [form, isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(values: ChangePasswordFormOutput) {
    try {
      await changePassword.mutateAsync(values);
      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      const parsedError = parseApiError(error);
      Object.entries(parsedError.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ChangePasswordFormInput, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  const parsedError = changePassword.error ? parseApiError(changePassword.error) : null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-dialog-title"
        className="w-full max-w-xl rounded-2xl border border-app-border bg-white p-6 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="change-password-dialog-title" className="font-heading text-2xl font-bold text-primary">
              Change password
            </h2>
            <p className="mt-2 text-sm leading-6 text-primary-light">
              Keep your account password up to date.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close password dialog"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 space-y-4">
          {parsedError ? (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {parsedError.message}
            </div>
          ) : null}

          <PasswordField
            id="profile-old-password"
            label="Current password"
            autoComplete="current-password"
            required
            disabled={changePassword.isPending}
            error={form.formState.errors.old_password?.message}
            {...form.register('old_password')}
          />

          <PasswordField
            id="profile-new-password"
            label="New password"
            autoComplete="new-password"
            required
            disabled={changePassword.isPending}
            error={form.formState.errors.new_password?.message}
            {...form.register('new_password')}
          />

          <PasswordField
            id="profile-confirm-password"
            label="Confirm password"
            autoComplete="new-password"
            required
            disabled={changePassword.isPending}
            error={form.formState.errors.confirm_password?.message}
            {...form.register('confirm_password')}
          />

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={onClose} className="min-h-11">
              Cancel
            </Button>
            <Button type="submit" isLoading={changePassword.isPending} className="min-h-11">
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
