'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { DEFAULT_AUTHENTICATED_PATH } from '@/lib/auth/redirects';
import { loginRequestSchema } from '@/lib/validators/auth';
import { useLogin } from '@/hooks/auth/useAuth';
import type { LoginRequest } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthDivider } from '@/components/auth/shared/auth-divider';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import FormField from '@/components/auth/shared/form-field';
import GoogleAuthButton from '@/components/auth/shared/google-auth-button';
import PasswordField from '@/components/auth/shared/password-field';

type LoginFormProps = {
  redirectTo?: string | null;
  successMessage?: string | null;
};

export default function LoginForm({ redirectTo, successMessage }: LoginFormProps) {
  const router = useRouter();
  const loginMutation = useLogin();
  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const parsedError = loginMutation.error
    ? parseApiError(loginMutation.error)
    : null;
  const isSubmitting = loginMutation.isPending;
  const describedBy = [
    successMessage ? 'login-form-success' : null,
    parsedError ? 'login-form-error' : null,
  ].filter(Boolean).join(' ') || undefined;

  async function onSubmit(values: LoginRequest) {
    try {
      await loginMutation.mutateAsync(values);
      router.replace(redirectTo ?? DEFAULT_AUTHENTICATED_PATH);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof LoginRequest, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
      aria-describedby={describedBy}
    >
      <GoogleAuthButton type="button" disabled={isSubmitting}>
        Sign In with Google
      </GoogleAuthButton>
      <AuthDivider />

      {successMessage && (
        <AuthAlert id="login-form-success" variant="success" title="Password reset">
          {successMessage}
        </AuthAlert>
      )}

      {parsedError && (
        <AuthAlert id="login-form-error" variant="error" title="Login failed">
          {parsedError.message}
        </AuthAlert>
      )}

      <FormField
        id="login-email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        required
        disabled={isSubmitting}
        icon={<Mail className="h-4 w-4" />}
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />

      <PasswordField
        id="login-password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
        required
        disabled={isSubmitting}
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Forgot password?
        </Link>
      </div>

      <AuthSubmitButton
        isLoading={isSubmitting}
        loadingLabel="Logging in…"
        className="mt-8"
      >
        Log in
      </AuthSubmitButton>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Sign up
        </Link>
      </p>

      <span className="sr-only" aria-live="polite">
        {isSubmitting ? 'Logging in to your account' : ''}
      </span>
    </form>
  );
}
