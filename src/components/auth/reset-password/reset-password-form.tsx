'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { resetPasswordFormSchema } from '@/lib/validators/auth';
import { useResetPassword } from '@/hooks/auth/useAuth';
import type { ResetPasswordFormInput, ResetPasswordFormOutput } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import { AuthStatus } from '@/components/auth/shared/auth-status';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import PasswordField from '@/components/auth/shared/password-field';

const RESET_SUCCESS_LOGIN_PATH = '/login?reset=success';

type ResetPasswordFormProps = {
  token: string | null;
};

function MissingResetToken() {
  return (
    <div className="w-full max-w-[24rem]">
      <AuthStatus
        title="Reset link missing"
        description="Open the password reset link from your email, or request a new reset link to continue."
        icon={<AlertTriangle aria-hidden="true" className="h-7 w-7" />}
        className="[&>div]:bg-red-600"
      />
      <p className="mt-6 text-center text-sm text-slate-500">
        Need another link?{' '}
        <Link
          href="/forgot-password"
          className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Request password reset
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const resetPasswordMutation = useResetPassword();
  const cleanToken = token?.trim() ?? '';
  const form = useForm<ResetPasswordFormInput, unknown, ResetPasswordFormOutput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token: cleanToken,
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const parsedError = resetPasswordMutation.error
    ? parseApiError(resetPasswordMutation.error)
    : null;
  const isSubmitting = resetPasswordMutation.isPending;

  async function onSubmit(values: ResetPasswordFormOutput) {
    try {
      await resetPasswordMutation.mutateAsync(values);
      router.replace(RESET_SUCCESS_LOGIN_PATH);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ResetPasswordFormInput, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  if (!cleanToken) {
    return <MissingResetToken />;
  }

  return (
    <AuthFormPanel
      title="Reset Password"
      subtitle="Create a new password to get back into your GigSecure account."
      className="max-w-[27.75rem] lg:self-start lg:mt-16"
    >
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        aria-describedby={parsedError ? 'reset-password-form-error' : undefined}
      >
        {parsedError && (
          <AuthAlert id="reset-password-form-error" variant="error" title="Could not reset password">
            {parsedError.message}
          </AuthAlert>
        )}

        <PasswordField
          id="reset-new-password"
          label="New password"
          placeholder="Enter your new password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={form.formState.errors.new_password?.message}
          {...form.register('new_password')}
        />

        <PasswordField
          id="reset-confirm-password"
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
          loadingLabel="Resetting password"
          className="h-12"
        >
          Reset password
        </AuthSubmitButton>

        <span className="sr-only" aria-live="polite">
          {isSubmitting ? 'Resetting your password' : ''}
        </span>
      </form>
    </AuthFormPanel>
  );
}
