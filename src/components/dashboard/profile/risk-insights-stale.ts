import type { ProfileEditableField } from '@/lib/validators/user';
import {
  ASSESSMENT_RELEVANT_PROFILE_FIELDS,
  type AssessmentRelevantProfileField,
} from '@/types/profile';

const TAG_BY_FIELD: Record<AssessmentRelevantProfileField, string> = {
  first_name: 'Personal details updated',
  last_name: 'Personal details updated',
  date_of_birth: 'Personal details updated',
  gender: 'Personal details updated',
  city: 'Location updated',
  state: 'Location updated',
  country: 'Location updated',
  occupation: 'Occupation updated',
  gig_platform: 'Work profile updated',
  average_monthly_income: 'Income updated',
  years_of_experience: 'Work profile updated',
};

export function getRiskInsightChangeTags(fields: readonly ProfileEditableField[]) {
  const relevantFields = fields.filter((field): field is AssessmentRelevantProfileField =>
    ASSESSMENT_RELEVANT_PROFILE_FIELDS.includes(field as AssessmentRelevantProfileField),
  );

  return Array.from(new Set(relevantFields.map((field) => TAG_BY_FIELD[field])));
}
