'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { parseApiError } from '@/lib/api/errors';
import { resendActivationRequestSchema } from '@/lib/validators/auth';
import { useResendActivation } from '@/hooks/auth/useAuth';
import type { ResendActivationRequest } from '@/types/auth';
import { AuthAlert } from '@/components/auth/shared/auth-alert';
import AuthSubmitButton from '@/components/auth/shared/auth-submit-button';
import FormField from '@/components/auth/shared/form-field';

export default function ResendActivationForm() {
  const resendMutation = useResendActivation();
  const form = useForm<ResendActivationRequest>({
    resolver: zodResolver(resendActivationRequestSchema),
    defaultValues: { email: '' },
    mode: 'onBlur',
  });
  const parsedError = resendMutation.error ? parseApiError(resendMutation.error) : null;

  async function onSubmit(values: ResendActivationRequest) {
    try {
      await resendMutation.mutateAsync(values);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ResendActivationRequest, {
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
      className="mt-6 space-y-4"
      aria-describedby={
        parsedError
          ? 'resend-activation-error'
          : resendMutation.isSuccess
            ? 'resend-activation-success'
            : undefined
      }
    >
      {resendMutation.isSuccess && (
        <AuthAlert id="resend-activation-success" variant="success" title="Email sent">
          If the email is registered, an activation link has been sent.
        </AuthAlert>
      )}

      {parsedError && (
        <AuthAlert id="resend-activation-error" variant="error" title="Could not resend email">
          {parsedError.message}
        </AuthAlert>
      )}

      <FormField
        id="resend-email"
        label="Email"
        type="email"
        placeholder="Enter your email"
        autoComplete="email"
        required
        icon={<Mail className="h-4 w-4" />}
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />

      <AuthSubmitButton
        isLoading={resendMutation.isPending}
        loadingLabel="Sending"
      >
        Resend activation email
      </AuthSubmitButton>

      <span className="sr-only" aria-live="polite">
        {resendMutation.isPending ? 'Sending activation email' : ''}
      </span>
    </form>
  );
}
