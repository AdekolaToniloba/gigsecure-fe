'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { activateAccountFormSchema } from '@/lib/validators/auth';
import { useActivateAccount } from '@/hooks/auth/useAuth';
import type { ActivateAccountFormInput, ActivateAccountFormOutput } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import { AuthStatus } from '@/components/auth/shared/auth-status';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import PasswordField from '@/components/auth/shared/password-field';

type ActivateAccountFormProps = {
  token: string | null;
};

function MissingActivationToken() {
  return (
    <div className="w-full max-w-[24rem]">
      <AuthStatus
        title="Activation link missing"
        description="Open the activation link from your email, or log in if your account is already active."
        icon={<AlertTriangle aria-hidden="true" className="h-7 w-7" />}
        className="[&>div]:bg-red-600"
      />
      <p className="mt-6 text-center text-sm text-slate-500">
        Already activated?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function ActivateAccountForm({ token }: ActivateAccountFormProps) {
  const router = useRouter();
  const activateMutation = useActivateAccount();
  const cleanToken = token?.trim() ?? '';
  const form = useForm<ActivateAccountFormInput, unknown, ActivateAccountFormOutput>({
    resolver: zodResolver(activateAccountFormSchema),
    defaultValues: {
      token: cleanToken,
      password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const parsedError = activateMutation.error
    ? parseApiError(activateMutation.error)
    : null;
  const isSubmitting = activateMutation.isPending;

  async function onSubmit(values: ActivateAccountFormOutput) {
    try {
      await activateMutation.mutateAsync(values);
      router.replace(DEFAULT_AUTHENTICATED_PATH);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ActivateAccountFormInput, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  if (!cleanToken) {
    return <MissingActivationToken />;
  }

  return (
    <AuthFormPanel
      title="Activate your account"
      subtitle="Set your password to finish activating your GigSecure account."
      className="max-w-[38.5rem]"
    >
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
        aria-describedby={parsedError ? 'activate-account-form-error' : undefined}
      >
        {parsedError && (
          <AuthAlert id="activate-account-form-error" variant="error" title="Could not activate account">
            {parsedError.message}
          </AuthAlert>
        )}

        <PasswordField
          id="activate-password"
          label="Password"
          placeholder="Enter your password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />

        <PasswordField
          id="activate-confirm-password"
          label="Confirm password"
          placeholder="Confirm your password"
          autoComplete="new-password"
          required
          disabled={isSubmitting}
          error={form.formState.errors.confirm_password?.message}
          {...form.register('confirm_password')}
        />

        <AuthSubmitButton
          isLoading={isSubmitting}
          loadingLabel="Activating account"
          className="mt-8"
        >
          Activate account
        </AuthSubmitButton>

        <span className="sr-only" aria-live="polite">
          {isSubmitting ? 'Activating your account' : ''}
        </span>
      </form>
    </AuthFormPanel>
  );
}
