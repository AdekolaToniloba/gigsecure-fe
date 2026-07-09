import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RiskScoreCard } from '@/components/risk-assessment/report/risk-score-card';
import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import { mockAssessmentResponse } from '@/__tests__/fixtures/mockAssessmentResponse';

function renderScore(score: number, riskProfile = 'Moderate Risk') {
  const model = createRiskReportDisplayModel({
    ...mockAssessmentResponse,
    overall_score: score,
    risk_profile: riskProfile,
  });
  render(
    <RiskScoreCard
      applicant={model.applicant}
      score={model.score}
      riskProfile={model.riskProfile}
    />,
  );
  return model;
}

describe('RiskScoreCard', () => {
  it.each([
    [0, '0%'],
    [68.5, '69%'],
    [100, '100%'],
  ])('renders the validated score boundary %s with an equivalent text label', (score, percentage) => {
    const model = renderScore(score);

    expect(screen.getByRole('img', { name: model.score.accessibleText })).toHaveAttribute(
      'data-visual-score',
      String(model.score.rounded),
    );
    expect(screen.getByText(percentage)).toBeVisible();
    expect(screen.getByText(`${model.score.rounded} out of 100`)).toBeVisible();
    expect(screen.getByText('Moderate Risk')).toBeVisible();
  });

  it('wraps long applicant and backend profile text without assuming a closed classification enum', () => {
    const profile = `Specialist contractor ${'concentration context '.repeat(15)}`.trim();
    renderScore(54, profile);

    expect(screen.getByText('Assessment for Toni Adeyemi')).toHaveClass('break-words');
    expect(screen.getByText(profile)).toHaveClass('break-words', '[overflow-wrap:anywhere]');
  });

  it('does not render unsupported dashboard metrics', () => {
    renderScore(68.5);

    expect(screen.queryByText(/plans needed|critical gaps|benchmark|last updated|monthly estimate/i))
      .not.toBeInTheDocument();
  });
});
