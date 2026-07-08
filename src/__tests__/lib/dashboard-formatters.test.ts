import { describe, expect, it } from 'vitest';
import {
  formatClassificationLabel,
  formatDashboardDate,
  formatNullableDisplay,
  formatPercentage,
  formatScoreSummary,
  getDashboardGreeting,
  UNAVAILABLE_VALUE,
} from '@/lib/dashboard/formatters';
import {
  createChartPath,
  describeChartPoints,
  normalizeChartPoints,
} from '@/lib/dashboard/chart';

describe('dashboard formatters', () => {
  it.each([
    ['2026-07-06T08:00:00+01:00', 'Good morning'],
    ['2026-07-06T14:00:00+01:00', 'Good afternoon'],
    ['2026-07-06T20:00:00+01:00', 'Good evening'],
  ])('derives a deterministic WAT greeting for %s', (isoDate, expected) => {
    expect(getDashboardGreeting(new Date(isoDate))).toBe(expected);
  });

  it('formats a supplied date with an explicit locale and time zone', () => {
    expect(formatDashboardDate(
      new Date('2026-07-06T12:00:00Z'),
      'en-GB',
      'Africa/Lagos',
    )).toBe('Monday, 6 July 2026');
  });

  it('uses truthful fallbacks instead of fabricated nullable values', () => {
    expect(formatNullableDisplay(null)).toBe(UNAVAILABLE_VALUE);
    expect(formatNullableDisplay(undefined)).toBe(UNAVAILABLE_VALUE);
    expect(formatNullableDisplay('   ')).toBe(UNAVAILABLE_VALUE);
    expect(formatNullableDisplay(Number.NaN)).toBe(UNAVAILABLE_VALUE);
    expect(formatNullableDisplay('₦300,000–₦500,000')).toBe('₦300,000–₦500,000');
  });

  it('formats arbitrary classification text and percentages without an enum', () => {
    expect(formatClassificationLabel('moderate_stability')).toBe('Moderate Stability');
    expect(formatPercentage(42.25, 'en-GB')).toBe('42.3%');
    expect(formatScoreSummary('moderate_stability', 42, 'en-GB'))
      .toBe('Moderate Stability — 42%');
  });

  it('never emits undefined or NaN for invalid date and score inputs', () => {
    const invalidDate = new Date(Number.NaN);
    expect(getDashboardGreeting(invalidDate)).toBe('Hello');
    expect(formatDashboardDate(invalidDate)).toBe(UNAVAILABLE_VALUE);
    expect(formatPercentage(Number.NaN)).toBe(UNAVAILABLE_VALUE);
    expect(formatScoreSummary(undefined, Number.NaN)).toBe('Not assessed');
  });
});

describe('dashboard chart helpers', () => {
  it('normalizes exact values into a bounded SVG coordinate space', () => {
    expect(normalizeChartPoints([10, 20, 15], 100, 60, 10)).toEqual([
      { x: 10, y: 50, value: 10 },
      { x: 50, y: 10, value: 20 },
      { x: 90, y: 30, value: 15 },
    ]);
  });

  it('centres single and flat series without producing NaN', () => {
    expect(normalizeChartPoints([7], 100, 60, 10)).toEqual([
      { x: 50, y: 30, value: 7 },
    ]);
    expect(normalizeChartPoints([7, 7], 100, 60, 10)).toEqual([
      { x: 10, y: 30, value: 7 },
      { x: 90, y: 30, value: 7 },
    ]);
  });

  it('creates an O(n) line path and a neutral textual equivalent', () => {
    const points = normalizeChartPoints([10, 20, 15], 100, 60, 10);
    expect(createChartPath(points)).toBe('M 10 50 L 50 10 L 90 30');
    expect(describeChartPoints([10, 20, 15], 'en-GB'))
      .toBe('Stability trend values: 10, 20, 15.');
  });

  it('returns honest empty output for missing or invalid chart data', () => {
    expect(normalizeChartPoints([], 100, 60)).toEqual([]);
    expect(normalizeChartPoints([1, Number.NaN], 100, 60)).toEqual([]);
    expect(createChartPath([])).toBe('');
    expect(createChartPath([{ x: Number.NaN, y: 0, value: 1 }])).toBe('');
    expect(describeChartPoints([])).toBe('No stability trend data available.');
  });
});
