'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { forgotPasswordRequestSchema } from '@/lib/validators/auth';
import { useForgotPassword } from '@/hooks/auth/useAuth';
import type { ForgotPasswordRequest } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import { AuthFormPanel } from '@/components/auth/shared/auth-shell';
import { AuthStatus } from '@/components/auth/shared/auth-status';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import FormField from '@/components/auth/shared/form-field';

export default function ForgotPasswordForm() {
  const [isEmailSent, setIsEmailSent] = useState(false);
  const forgotPasswordMutation = useForgotPassword();
  const form = useForm<ForgotPasswordRequest>({
    resolver: zodResolver(forgotPasswordRequestSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const parsedError = forgotPasswordMutation.error
    ? parseApiError(forgotPasswordMutation.error)
    : null;
  const isSubmitting = forgotPasswordMutation.isPending;

  async function onSubmit(values: ForgotPasswordRequest) {
    try {
      await forgotPasswordMutation.mutateAsync(values);
      setIsEmailSent(true);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ForgotPasswordRequest, {
            type: 'server',
            message: messages[0],
          });
        }
      });
    }
  }

  if (isEmailSent) {
    return (
      <AuthStatus
        title="Email sent"
        description="We've sent a password reset link to your email. Follow the instructions to create a new password."
        className="max-w-[24.5rem] rounded-[1.25rem] px-10 py-16"
      />
    );
  }

  return (
    <AuthFormPanel
      title="Forgot Password"
      subtitle="Forgot your password? It happens we'll help you get back in."
      className="max-w-[27.75rem] lg:self-start lg:mt-16"
    >
      <form
        noValidate
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        aria-describedby={parsedError ? 'forgot-password-form-error' : undefined}
      >
        {parsedError && (
          <AuthAlert id="forgot-password-form-error" variant="error" title="Could not send reset link">
            {parsedError.message}
          </AuthAlert>
        )}

        <FormField
          id="forgot-password-email"
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

        <AuthSubmitButton
          isLoading={isSubmitting}
          loadingLabel="Sending"
          className="h-12"
        >
          Submit
        </AuthSubmitButton>

        <span className="sr-only" aria-live="polite">
          {isSubmitting ? 'Sending password reset link' : ''}
        </span>
      </form>
    </AuthFormPanel>
  );
}
