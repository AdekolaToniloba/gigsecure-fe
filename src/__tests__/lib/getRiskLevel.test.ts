import { describe, it, expect } from 'vitest';
import { getRiskLevel } from '@/app/(wizard)/assessment/_lib/getRiskLevel';
import { reportColors } from '@/lib/report-theme';

describe('getRiskLevel', () => {
  it('returns High Risk for score > 70', () => {
    const result = getRiskLevel(80);
    expect(result.label).toBe('High Risk');
    expect(result.colors).toEqual(reportColors.risk.high);
  });

  it('returns Moderate for score between 40 and 70 (inclusive)', () => {
    const result40 = getRiskLevel(40);
    expect(result40.label).toBe('Moderate');
    expect(result40.colors).toEqual(reportColors.risk.moderate);

    const result70 = getRiskLevel(70);
    expect(result70.label).toBe('Moderate');
    expect(result70.colors).toEqual(reportColors.risk.moderate);

    const result55 = getRiskLevel(55);
    expect(result55.label).toBe('Moderate');
  });

  it('returns Low Risk for score < 40', () => {
    const result = getRiskLevel(30);
    expect(result.label).toBe('Low Risk');
    expect(result.colors).toEqual(reportColors.risk.low);
  });
});
