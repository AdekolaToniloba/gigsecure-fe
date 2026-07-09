import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import type { ProfileEditableField, ProfileFormInput } from '@/lib/validators/user';

type ProfileFieldConfig = {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
};

const PROFILE_FIELD_CONFIGS: Record<ProfileEditableField, ProfileFieldConfig> = {
  first_name: { label: 'First name', autoComplete: 'given-name' },
  last_name: { label: 'Last name', autoComplete: 'family-name' },
  phone_number: { label: 'Phone number', type: 'tel', autoComplete: 'tel' },
  date_of_birth: { label: 'Date of birth', type: 'date', autoComplete: 'bday' },
  gender: { label: 'Gender', placeholder: 'Enter your gender' },
  address_line_1: { label: 'Address line 1', autoComplete: 'address-line1', className: 'sm:col-span-2' },
  address_line_2: { label: 'Address line 2', autoComplete: 'address-line2', className: 'sm:col-span-2' },
  city: { label: 'City', autoComplete: 'address-level2' },
  state: { label: 'State', autoComplete: 'address-level1' },
  country: { label: 'Country', autoComplete: 'country-name' },
  postal_code: { label: 'Postal code', autoComplete: 'postal-code' },
  occupation: { label: 'Occupation', placeholder: 'Enter your occupation' },
  gig_platform: { label: 'Gig platform', placeholder: 'Enter your main platform' },
  average_monthly_income: { label: 'Average monthly income', inputMode: 'decimal', placeholder: 'e.g. 150000' },
  years_of_experience: { label: 'Years of experience', inputMode: 'numeric', placeholder: 'e.g. 5' },
  profile_picture_url: { label: 'Profile picture URL', placeholder: 'https://example.com/avatar.png', className: 'sm:col-span-2' },
};

type ProfileFormFieldsProps = {
  fields: readonly ProfileEditableField[];
  register: UseFormRegister<ProfileFormInput>;
  errors: FieldErrors<ProfileFormInput>;
  disabled?: boolean;
};

export function ProfileFormFields({
  fields,
  register,
  errors,
  disabled = false,
}: ProfileFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((field) => {
        const config = PROFILE_FIELD_CONFIGS[field];
        const error = errors[field]?.message as string | undefined;
        const describedBy = error ? `${field}-error` : undefined;

        return (
          <div key={field} className={config.className}>
            <label htmlFor={field} className="block text-sm font-medium text-slate-900">
              {config.label}
            </label>
            <input
              id={field}
              type={config.type ?? 'text'}
              autoComplete={config.autoComplete}
              inputMode={config.inputMode}
              placeholder={config.placeholder}
              disabled={disabled}
              aria-invalid={error ? 'true' : undefined}
              aria-describedby={describedBy}
              className="mt-2 h-12 w-full rounded-xl border border-app-border bg-white px-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              {...register(field)}
            />
            {error ? (
              <p id={`${field}-error`} role="alert" className="mt-2 text-xs font-medium text-rose-600">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
