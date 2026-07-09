'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Button from '@/components/ui/Button';
import { useUpdateProfile } from '@/hooks/user/useUser';
import { parseApiError } from '@/lib/api/errors';
import {
  buildDirtyProfilePayload,
  profileFormSchema,
  type ProfileEditableField,
  type ProfileFormInput,
  type ProfileFormOutput,
} from '@/lib/validators/user';
import type { ProfileResponse } from '@/types/profile';
import { ProfileFormFields } from './profile-form-fields';

type PersonalInformationFormProps = {
  fields: readonly ProfileEditableField[];
  initialValues: ProfileFormInput;
  profileResponse: ProfileResponse;
  onCancel: () => void;
  onSuccess: (changedFields: ProfileEditableField[]) => void;
};

export function PersonalInformationForm({
  fields,
  initialValues,
  profileResponse,
  onCancel,
  onSuccess,
}: PersonalInformationFormProps) {
  const updateProfile = useUpdateProfile();
  const form = useForm<ProfileFormInput, unknown, ProfileFormOutput>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  async function onSubmit(values: ProfileFormOutput) {
    const payload = buildDirtyProfilePayload(values, profileResponse, fields);
    const payloadFields = Object.keys(payload) as ProfileEditableField[];
    if (payloadFields.length === 0) return;

    try {
      await updateProfile.mutateAsync(payload);
      onSuccess(payloadFields);
    } catch (error) {
      const parsedError = parseApiError(error);
      Object.entries(parsedError.fieldErrors).forEach(([field, messages]) => {
        if (field in form.getValues()) {
          form.setError(field as keyof ProfileFormInput, {
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
      aria-describedby={updateProfile.parsedError ? 'profile-form-error' : undefined}
    >
      {updateProfile.parsedError ? (
        <div
          id="profile-form-error"
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          {updateProfile.parsedError.message}
        </div>
      ) : null}

      <ProfileFormFields
        fields={fields}
        register={form.register}
        errors={form.formState.errors}
        disabled={updateProfile.isPending}
      />

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            form.reset(initialValues);
            onCancel();
          }}
          className="min-h-11"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={updateProfile.isPending}
          disabled={!form.formState.isDirty}
          className="min-h-11"
        >
          Save changes
        </Button>
      </div>
    </form>
  );
}
