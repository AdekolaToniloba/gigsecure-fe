const DEFAULT_LOCALE = 'en-NG';
const DEFAULT_TIME_ZONE = 'Africa/Lagos';
export const UNAVAILABLE_VALUE = 'Not available';

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function getDashboardGreeting(
  date: Date,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  if (!isValidDate(date)) return 'Hello';

  const hourPart = new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    hourCycle: 'h23',
    timeZone,
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour');
  const hour = Number(hourPart?.value);

  if (!Number.isFinite(hour)) return 'Hello';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function formatDashboardDate(
  date: Date,
  locale = DEFAULT_LOCALE,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  if (!isValidDate(date)) return UNAVAILABLE_VALUE;

  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone,
  }).format(date);
}

export function formatNullableDisplay(
  value: string | number | null | undefined,
  fallback = UNAVAILABLE_VALUE,
): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function formatClassificationLabel(
  classification: string | null | undefined,
  fallback = 'Not assessed',
): string {
  const value = classification?.trim();
  if (!value) return fallback;

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
}

export function formatPercentage(
  value: number | null | undefined,
  locale = DEFAULT_LOCALE,
  fallback = UNAVAILABLE_VALUE,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatScoreSummary(
  classification: string | null | undefined,
  score: number | null | undefined,
  locale = DEFAULT_LOCALE,
): string {
  const label = formatClassificationLabel(classification);
  const percentage = formatPercentage(score, locale);

  return percentage === UNAVAILABLE_VALUE ? label : `${label} — ${percentage}`;
}
