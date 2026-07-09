import {
  createProfileFormValues,
  type ProfileEditableField,
} from '@/lib/validators/user';
import type { ProfileResponse } from '@/types/profile';
import { EditableProfileSection } from './editable-profile-section';
import { ProfileFieldRow } from './profile-field-row';
import { formatFieldValue, getProfileFallbackText } from './profile-formatters';

type PersonalInformationSectionProps = {
  profileResponse: ProfileResponse;
  onAssessmentRelevantUpdate?: (fields: ProfileEditableField[]) => void;
};

const PROFILE_SECTIONS: Array<{
  key: string;
  title: string;
  description: string;
  fields: readonly ProfileEditableField[];
}> = [
  {
    key: 'basic',
    title: 'Basic details',
    description: 'Update the personal details your dashboard uses to identify your account.',
    fields: ['first_name', 'last_name', 'phone_number'],
  },
  {
    key: 'identity',
    title: 'Personal details',
    description: 'Keep your date of birth and gender information current.',
    fields: ['date_of_birth', 'gender'],
  },
  {
    key: 'address',
    title: 'Address',
    description: 'Manage your current address and location details.',
    fields: ['address_line_1', 'address_line_2', 'city', 'state', 'country', 'postal_code'],
  },
  {
    key: 'work',
    title: 'Work profile',
    description: 'Keep your work context and financial profile aligned with your current situation.',
    fields: ['occupation', 'gig_platform', 'average_monthly_income', 'years_of_experience', 'profile_picture_url'],
  },
] as const;

export function PersonalInformationSection({
  profileResponse,
  onAssessmentRelevantUpdate,
}: PersonalInformationSectionProps) {
  const { user, profile } = profileResponse;
  const initialValues = createProfileFormValues(profileResponse);

  return (
    <div className="space-y-5">
      {PROFILE_SECTIONS.map((section) => (
        <EditableProfileSection
          key={section.key}
          title={section.title}
          description={section.description}
          fields={section.fields}
          initialValues={initialValues}
          profileResponse={profileResponse}
          onAssessmentRelevantUpdate={onAssessmentRelevantUpdate}
          rows={(
            <dl>
              {section.key === 'basic' ? (
                <>
                  <ProfileFieldRow label="First name" value={user.first_name} />
                  <ProfileFieldRow label="Last name" value={user.last_name} emptyValue={null} />
                  <ProfileFieldRow label="Email" value={user.email} />
                  <ProfileFieldRow label="Phone number" value={user.phone_number} emptyValue={null} />
                </>
              ) : null}

              {section.key === 'identity' ? (
                <>
                  <ProfileFieldRow label="Date of birth" value={formatFieldValue('date_of_birth', profile?.date_of_birth)} />
                  <ProfileFieldRow label="Gender" value={profile?.gender} emptyValue={null} />
                </>
              ) : null}

              {section.key === 'address' ? (
                <>
                  <ProfileFieldRow label="Address line 1" value={profile?.address_line_1} emptyValue={null} />
                  <ProfileFieldRow label="Address line 2" value={profile?.address_line_2} emptyValue={null} />
                  <ProfileFieldRow label="City" value={profile?.city} emptyValue={null} />
                  <ProfileFieldRow label="State" value={profile?.state} emptyValue={null} />
                  <ProfileFieldRow label="Country" value={profile?.country} emptyValue={null} />
                  <ProfileFieldRow label="Postal code" value={profile?.postal_code} emptyValue={null} />
                </>
              ) : null}

              {section.key === 'work' ? (
                <>
                  <ProfileFieldRow label="Occupation" value={profile?.occupation} emptyValue={null} />
                  <ProfileFieldRow label="Gig platform" value={profile?.gig_platform} emptyValue={null} />
                  <ProfileFieldRow label="Average monthly income" value={formatFieldValue('average_monthly_income', profile?.average_monthly_income)} />
                  <ProfileFieldRow label="Years of experience" value={formatFieldValue('years_of_experience', profile?.years_of_experience)} />
                  <ProfileFieldRow label="Profile picture URL" value={getProfileFallbackText(profile?.profile_picture_url)} />
                </>
              ) : null}
            </dl>
          )}
        />
      ))}
    </div>
  );
}
