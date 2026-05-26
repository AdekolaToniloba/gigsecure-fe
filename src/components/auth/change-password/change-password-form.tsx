'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { changePasswordFormSchema } from '@/lib/validators/auth';
import { useChangePassword } from '@/hooks/auth/useAuth';
import type { ChangePasswordFormInput, ChangePasswordFormOutput } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import PasswordField from '@/components/auth/shared/password-field';

export default function ChangePasswordForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const changePasswordMutation = useChangePassword();
  const form = useForm<ChangePasswordFormInput, unknown, ChangePasswordFormOutput>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const parsedError = changePasswordMutation.error
    ? parseApiError(changePasswordMutation.error)
    : null;
  const isSubmitting = changePasswordMutation.isPending;
  const describedBy = [
    successMessage ? 'change-password-success' : null,
    parsedError ? 'change-password-error' : null,
  ].filter(Boolean).join(' ') || undefined;

  async function onSubmit(values: ChangePasswordFormOutput) {
    setSuccessMessage(null);

    try {
      await changePasswordMutation.mutateAsync(values);
      form.reset({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
      setSuccessMessage('Your password has been changed successfully.');
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ChangePasswordFormInput, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  return (
    <div className="w-full rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
      <AuthFormPanel
        title="Change password"
        subtitle="Update your password while keeping your GigSecure session active."
        className="max-w-none"
      >
        <form
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-5"
          aria-describedby={describedBy}
        >
          {successMessage && (
            <AuthAlert id="change-password-success" variant="success" title="Password changed">
              {successMessage}
            </AuthAlert>
          )}

          {parsedError && (
            <AuthAlert id="change-password-error" variant="error" title="Could not change password">
              {parsedError.message}
            </AuthAlert>
          )}

          <PasswordField
            id="change-current-password"
            label="Current password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
            error={form.formState.errors.old_password?.message}
            {...form.register('old_password')}
          />

          <PasswordField
            id="change-new-password"
            label="New password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            error={form.formState.errors.new_password?.message}
            {...form.register('new_password')}
          />

          <PasswordField
            id="change-confirm-password"
            label="Confirm password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            required
            disabled={isSubmitting}
            error={form.formState.errors.confirm_password?.message}
            {...form.register('confirm_password')}
          />

          <AuthSubmitButton
            isLoading={isSubmitting}
            loadingLabel="Changing password"
            className="mt-8 h-12"
          >
            Change password
          </AuthSubmitButton>

          <span className="sr-only" aria-live="polite">
            {isSubmitting ? 'Changing your password' : ''}
          </span>
        </form>
      </AuthFormPanel>
    </div>
  );
}
