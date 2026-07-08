import type { UserWithProfileResponse } from '@/lib/validators/user';
import type { AssessmentMode } from './assessment-route-context';

export type WizardPersonalDetailsDefaults = {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  state: string;
  city: string;
  occupation: string;
  marital_status: string;
};

type ProfileToWizardDefaultsOptions = {
  mode: AssessmentMode;
  resumedAnswers?: Record<string, unknown>;
  profileResponse?: UserWithProfileResponse;
  waitlistUser?: {
    firstName: string | null;
    lastName: string | null;
  };
};

const PERSONAL_DETAIL_KEYS = [
  'first_name',
  'last_name',
  'date_of_birth',
  'gender',
  'state',
  'city',
  'occupation',
  'marital_status',
] as const satisfies ReadonlyArray<keyof WizardPersonalDetailsDefaults>;

export function profileToWizardDefaults({
  mode,
  resumedAnswers = {},
  profileResponse,
  waitlistUser,
}: ProfileToWizardDefaultsOptions): WizardPersonalDetailsDefaults {
  const profileDefaults = mode === 'dashboard'
    ? {
        first_name: profileResponse?.user.first_name,
        last_name: profileResponse?.user.last_name,
        date_of_birth: formatDateOfBirth(profileResponse?.profile?.date_of_birth),
        gender: profileResponse?.profile?.gender?.toLowerCase(),
        state: profileResponse?.profile?.state,
        city: profileResponse?.profile?.city,
        occupation: profileResponse?.profile?.occupation,
      }
    : {
        first_name: waitlistUser?.firstName,
        last_name: waitlistUser?.lastName,
      };

  return PERSONAL_DETAIL_KEYS.reduce<WizardPersonalDetailsDefaults>(
    (defaults, key) => {
      defaults[key] = firstNonEmptyString(
        resumedAnswers[key],
        profileDefaults[key as keyof typeof profileDefaults],
      );
      return defaults;
    },
    {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      gender: '',
      state: '',
      city: '',
      occupation: '',
      marital_status: '',
    },
  );
}

function firstNonEmptyString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function formatDateOfBirth(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;

  const isoDate = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value);
  if (!isoDate) return undefined;

  return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
}
