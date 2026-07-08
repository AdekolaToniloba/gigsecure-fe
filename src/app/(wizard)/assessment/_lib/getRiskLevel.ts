import { formatRiskScore } from '@/lib/risk/report-display-model';

const neutralRiskColors = {
  bg: '#E8F3F1',
  text: '#004E4C',
  bar: '#1B686C',
} as const;

/**
 * Pillar classifications are not contracted or product-approved. This helper
 * exposes only the validated numeric score with a neutral visual treatment.
 */
export function getRiskScorePresentation(score: number) {
  const roundedScore = formatRiskScore(score);
  return {
    label: `${roundedScore}%`,
    accessibleLabel: `${roundedScore} out of 100`,
    colors: neutralRiskColors,
  };
}
