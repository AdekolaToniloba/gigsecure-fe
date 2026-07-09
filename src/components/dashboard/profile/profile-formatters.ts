const fallbackValue = 'Not provided';

function toDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getProfileFallbackText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : fallbackValue;
}

export function formatProfileDate(value: string | null | undefined) {
  if (!value) return fallbackValue;
  const parsed = toDate(value);
  if (!parsed) return fallbackValue;
  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

export function formatProfileAmount(value: string | null | undefined) {
  if (!value) return fallbackValue;
  const amount = Number(value);
  if (!Number.isFinite(amount)) return fallbackValue;
  return new Intl.NumberFormat('en-NG').format(amount);
}

export function formatYearsOfExperience(value: number | null | undefined) {
  if (value === null || value === undefined) return fallbackValue;
  return `${value} ${value === 1 ? 'year' : 'years'}`;
}

export function formatUserName(firstName?: string | null, lastName?: string | null) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  return fullName || 'GigSecure user';
}

export function formatFieldValue(field: string, value: string | number | null | undefined) {
  switch (field) {
    case 'date_of_birth':
      return formatProfileDate(typeof value === 'string' ? value : null);
    case 'average_monthly_income':
      return formatProfileAmount(typeof value === 'string' ? value : null);
    case 'years_of_experience':
      return formatYearsOfExperience(typeof value === 'number' ? value : null);
    default:
      return getProfileFallbackText(typeof value === 'string' ? value : null);
  }
}
