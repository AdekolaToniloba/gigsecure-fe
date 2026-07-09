'use client';

import { useEffect, useRef, useState } from 'react';
import type { ProfileEditableField, ProfileFormInput } from '@/lib/validators/user';
import type { ProfileResponse } from '@/types/profile';
import { PersonalInformationForm } from './personal-information-form';

type EditableProfileSectionProps = {
  title: string;
  description: string;
  rows: React.ReactNode;
  fields: readonly ProfileEditableField[];
  initialValues: ProfileFormInput;
  profileResponse: ProfileResponse;
  onAssessmentRelevantUpdate?: (fields: ProfileEditableField[]) => void;
};

export function EditableProfileSection({
  title,
  description,
  rows,
  fields,
  initialValues,
  profileResponse,
  onAssessmentRelevantUpdate,
}: EditableProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const editButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isEditing) {
      editButtonRef.current?.focus();
    }
  }, [isEditing]);

  return (
    <section className="rounded-2xl border border-app-border bg-white p-5 shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-heading text-xl font-bold text-primary">{title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-light">{description}</p>
        </div>
        <button
          ref={editButtonRef}
          type="button"
          onClick={() => {
            setStatusMessage('');
            setIsEditing(true);
          }}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Edit ${title}`}
        >
          Edit
        </button>
      </div>

      <div aria-live="polite" role="status" className="mt-3 text-sm text-emerald-700">
        {statusMessage}
      </div>

      <div className="mt-4 min-w-0">
        {isEditing ? (
          <PersonalInformationForm
            fields={fields}
            initialValues={initialValues}
            profileResponse={profileResponse}
            onCancel={() => setIsEditing(false)}
            onSuccess={(changedFields) => {
              setIsEditing(false);
              setStatusMessage('Changes saved successfully.');
              onAssessmentRelevantUpdate?.(changedFields);
            }}
          />
        ) : rows}
      </div>
    </section>
  );
}
