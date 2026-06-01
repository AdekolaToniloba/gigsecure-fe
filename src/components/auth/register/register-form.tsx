'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { registerFormSchema } from '@/lib/validators/auth';
import { useRegister } from '@/hooks/auth/useAuth';
import type { RegisterFormInput, RegisterFormOutput } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthDivider } from '@/components/auth/shared/auth-divider';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import FormField from '@/components/auth/shared/form-field';
import GoogleAuthButton from '@/components/auth/shared/google-auth-button';
import PasswordField from '@/components/auth/shared/password-field';

const CHECK_INBOX_PATH = '/check-inbox';

export default function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();
  const form = useForm<RegisterFormInput, unknown, RegisterFormOutput>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  });

  const parsedError = registerMutation.error
    ? parseApiError(registerMutation.error)
    : null;

  async function onSubmit(values: RegisterFormOutput) {
    try {
      await registerMutation.mutateAsync(values);
      router.push(CHECK_INBOX_PATH);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof RegisterFormInput, {
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
      aria-describedby={parsedError ? 'register-form-error' : undefined}
    >
      <GoogleAuthButton type="button">Sign Up with Google</GoogleAuthButton>
      <AuthDivider />

      {parsedError && (
        <AuthAlert id="register-form-error" variant="error" title="Registration failed">
          {parsedError.message}
        </AuthAlert>
      )}

      <FormField
        id="register-first-name"
        label="First name"
        placeholder="Enter your first name"
        autoComplete="given-name"
        required
        icon={<User className="h-4 w-4" />}
        error={form.formState.errors.first_name?.message}
        {...form.register('first_name')}
      />

      <FormField
        id="register-last-name"
        label="Last name"
        placeholder="Enter your last name"
        autoComplete="family-name"
        icon={<User className="h-4 w-4" />}
        error={form.formState.errors.last_name?.message}
        {...form.register('last_name')}
      />

      <FormField
        id="register-email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        required
        icon={<Mail className="h-4 w-4" />}
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />

      <PasswordField
        id="register-password"
        label="Password"
        placeholder="Enter your password"
        autoComplete="new-password"
        required
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />

      <PasswordField
        id="register-confirm-password"
        label="Confirm password"
        placeholder="Confirm your password"
        autoComplete="new-password"
        required
        error={form.formState.errors.confirm_password?.message}
        {...form.register('confirm_password')}
      />

      <AuthSubmitButton
        isLoading={registerMutation.isPending}
        loadingLabel="Creating account…"
        className="mt-8"
      >
        Get Started
      </AuthSubmitButton>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary transition hover:text-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-muted"
        >
          Log in
        </Link>
      </p>

      <span className="sr-only" aria-live="polite">
        {registerMutation.isPending ? 'Creating your account' : ''}
      </span>
    </form>
  );
}
