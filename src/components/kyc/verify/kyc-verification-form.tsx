'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { FileDigit, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type BaseSyntheticEvent } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import FormField from '@/components/auth/shared/form-field';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import { KycResultAlert } from '@/components/kyc/verify/kyc-result-alert';
import { parseApiError } from '@/lib/api/errors';
import { kycVerifyRequestSchema } from '@/lib/validators/kyc';
import { useVerifyKyc } from '@/hooks/kyc/useKyc';
import { useUserProfile } from '@/hooks/user/useUserProfile';
import type { KYCVerifyRequest } from '@/lib/validators/kyc';
import type { KycVerifyStatus } from '@/types/kyc';

const COOLDOWN_MS = 60 * 60 * 1000;
const DASHBOARD_PATH = '/dashboard';

function isValidDatePickerValue(value: string) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;

  const [day, month, year] = value.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

const datePickerDateSchema = z
  .string()
  .refine(isValidDatePickerValue, 'Enter a valid date of birth.');

const kycVerificationFormSchema = z.object({
  document_number: kycVerifyRequestSchema.shape.document_number,
  first_name: kycVerifyRequestSchema.shape.first_name,
  last_name: kycVerifyRequestSchema.shape.last_name,
  date_of_birth: datePickerDateSchema,
});

type KycVerificationFormValues = z.infer<typeof kycVerificationFormSchema>;

function toDatePickerValue(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function toApiDate(value: string) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

function formatCooldown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

function getResultCopy(status: KycVerifyStatus, message: string) {
  if (status === 'verified') {
    return {
      title: 'Identity verified',
      body: message || 'Your identity has been verified successfully.',
    };
  }

  if (status === 'rejected') {
    return {
      title: 'Details did not match records',
      body: `${message || 'The details you submitted did not match identity records.'} Double-check your identity slip or card details before trying again.`,
    };
  }

  return {
    title: 'Verification could not be completed',
    body: `${message || 'Verification could not be completed due to a technical issue.'} This is not caused by your details. Please try again after the cooldown.`,
  };
}

export function KycVerificationForm() {
  const router = useRouter();
  const profileQuery = useUserProfile();
  const verifyKyc = useVerifyKyc();
  const [result, setResult] = useState<{
    status: KycVerifyStatus;
    message: string;
  } | null>(null);
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  const form = useForm<KycVerificationFormValues>({
    resolver: zodResolver(kycVerificationFormSchema),
    defaultValues: {
      document_number: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    const data = profileQuery.data;
    if (!data || form.formState.isDirty) return;

    form.reset({
      document_number: '',
      first_name: data.user.first_name ?? '',
      last_name: data.user.last_name ?? '',
      date_of_birth: toDatePickerValue(data.profile?.date_of_birth),
    });
  }, [form, profileQuery.data]);

  const cooldownRemaining = useMemo(() => {
    if (!lastAttemptAt) return 0;
    return Math.max(0, lastAttemptAt + COOLDOWN_MS - now);
  }, [lastAttemptAt, now]);
  const isCoolingDown = cooldownRemaining > 0;
  const parsedError = verifyKyc.parsedError;
  const resultCopy = result ? getResultCopy(result.status, result.message) : null;

  useEffect(() => {
    if (!isCoolingDown) return;

    const interval = window.setInterval(() => {
      setNow((currentNow) => currentNow + 1000);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isCoolingDown]);

  async function onSubmit(values: KycVerificationFormValues, event?: BaseSyntheticEvent) {
    if (isCoolingDown) return;

    setResult(null);

    const payload: KYCVerifyRequest = {
      document_type: 'NIN',
      document_number: values.document_number,
      first_name: values.first_name,
      last_name: values.last_name,
      date_of_birth: toApiDate(values.date_of_birth),
    };

    try {
      const response = await verifyKyc.mutateAsync(payload);
      setResult({ status: response.status, message: response.message });

      if (response.status === 'verified') {
        router.push(DASHBOARD_PATH);
        return;
      }

      const attemptTime = typeof event?.timeStamp === 'number' ? event.timeStamp : now;
      setLastAttemptAt(attemptTime);
      setNow(attemptTime);
    } catch (error) {
      const parsed = parseApiError(error);
      Object.entries(parsed.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof KycVerificationFormValues, {
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
      className="space-y-5"
      aria-describedby="kyc-form-status"
    >
      <div id="kyc-form-status" className="space-y-4" aria-live="polite" aria-atomic="true">
        {profileQuery.isLoading ? (
          <KycResultAlert status="info" title="Loading profile">
            We are checking your profile details so the form can be prefilled where possible.
          </KycResultAlert>
        ) : null}

        {profileQuery.error ? (
          <KycResultAlert status="info" title="Profile details unavailable">
            You can still complete the form manually.
          </KycResultAlert>
        ) : null}

        {result && resultCopy ? (
          <KycResultAlert status={result.status} title={resultCopy.title}>
            {resultCopy.body}
          </KycResultAlert>
        ) : null}

        {isCoolingDown ? (
          <KycResultAlert status="info" title="Retry cooldown active">
            You can try verification again in {formatCooldown(cooldownRemaining)}.
          </KycResultAlert>
        ) : null}

        {parsedError ? (
          <KycResultAlert status="failed" title="Verification request failed">
            {parsedError.message}
          </KycResultAlert>
        ) : null}
      </div>

      <div className="rounded-lg border border-primary/10 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-light">
          Document type
        </p>
        <p className="mt-1 text-lg font-semibold text-primary">NIN</p>
        <p className="mt-1 text-sm text-slate-500">
          GigSecure currently verifies identity with this Nigerian identity number.
        </p>
      </div>

      <FormField
        id="kyc-document-number"
        label="Document number"
        placeholder="Enter 11 digits"
        required
        inputMode="numeric"
        autoComplete="off"
        maxLength={11}
        icon={<FileDigit className="h-4 w-4" />}
        error={form.formState.errors.document_number?.message}
        disabled={verifyKyc.isPending || isCoolingDown}
        {...form.register('document_number')}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="kyc-first-name"
          label="First name"
          placeholder="Enter your first name"
          required
          autoComplete="given-name"
          icon={<User className="h-4 w-4" />}
          error={form.formState.errors.first_name?.message}
          disabled={verifyKyc.isPending || isCoolingDown}
          {...form.register('first_name')}
        />

        <FormField
          id="kyc-last-name"
          label="Last name"
          placeholder="Enter your last name"
          required
          autoComplete="family-name"
          icon={<User className="h-4 w-4" />}
          error={form.formState.errors.last_name?.message}
          disabled={verifyKyc.isPending || isCoolingDown}
          {...form.register('last_name')}
        />
      </div>

      <Controller
        control={form.control}
        name="date_of_birth"
        render={({ field, fieldState }) => {
          const descriptionId = 'kyc-date-of-birth-description';
          const errorId = fieldState.error ? 'kyc-date-of-birth-error' : undefined;

          return (
            <div className="space-y-1.5">
              <label htmlFor="kyc-date-of-birth" className="block text-xs font-semibold text-slate-900">
                Date of birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DatePicker
                  id="kyc-date-of-birth"
                  name={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={verifyKyc.isPending || isCoolingDown}
                  hasError={!!fieldState.error}
                  ariaDescribedBy={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
                />
              </div>
              <p id={descriptionId} className="text-xs text-slate-500">
                Use the date that appears on your identity record.
              </p>
              {fieldState.error ? (
                <p id={errorId} role="alert" className="text-xs font-medium text-red-600">
                  {fieldState.error.message}
                </p>
              ) : null}
            </div>
          );
        }}
      />

      <Button
        type="submit"
        isLoading={verifyKyc.isPending}
        disabled={isCoolingDown}
        className="w-full"
      >
        {verifyKyc.isPending ? 'Submitting verification...' : 'Submit verification'}
      </Button>

      <span className="sr-only" aria-live="polite">
        {verifyKyc.isPending ? 'Submitting KYC verification' : ''}
      </span>
    </form>
  );
}
