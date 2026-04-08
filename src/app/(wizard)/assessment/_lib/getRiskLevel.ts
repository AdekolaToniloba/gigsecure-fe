import { reportColors } from '@/lib/report-theme';

/**
 * Returns the risk level label and color set for a given pillar score.
 */
export function getRiskLevel(score: number) {
  if (score > 70) return { label: 'High Risk', colors: reportColors.risk.high };
  if (score >= 40) return { label: 'Moderate', colors: reportColors.risk.moderate };
  return { label: 'Low Risk', colors: reportColors.risk.low };
}
