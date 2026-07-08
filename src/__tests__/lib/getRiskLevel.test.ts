import { describe, expect, it } from 'vitest';
import { getRiskScorePresentation } from '@/app/(wizard)/assessment/_lib/getRiskLevel';

describe('getRiskScorePresentation', () => {
  it.each([30, 40, 70, 80])('uses neutral numeric output for %s without deriving a risk level', (score) => {
    const result = getRiskScorePresentation(score);

    expect(result.label).toBe(`${score}%`);
    expect(result.accessibleLabel).toBe(`${score} out of 100`);
    expect(result.label).not.toMatch(/low|moderate|high/i);
  });

  it('uses the shared tested rounding rule', () => {
    expect(getRiskScorePresentation(68.5).label).toBe('69%');
  });
});
