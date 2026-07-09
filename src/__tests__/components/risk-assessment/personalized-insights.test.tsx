import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PersonalizedInsights } from '@/components/risk-assessment/report/personalized-insights';
import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import { mockAssessmentResponse } from '@/__tests__/fixtures/mockAssessmentResponse';

function modelWithInsights(aiInsights: string) {
  return createRiskReportDisplayModel({ ...mockAssessmentResponse, ai_insights: aiInsights });
}

describe('PersonalizedInsights', () => {
  it('renders authored sections and content from the shared parsed model', () => {
    const model = modelWithInsights(mockAssessmentResponse.ai_insights);
    render(<PersonalizedInsights insights={model.insights} />);

    const section = screen.getByRole('region', { name: 'Personalized insights' });
    expect(within(section).getByRole('heading', { name: 'Personalized insights' })).toBeVisible();
    expect(within(section).getByText('Income Vulnerability')).toBeVisible();
    expect(within(section).getByText('RISK FACTORS')).toBeVisible();
  });

  it('degrades malformed authored markup to readable plain text', () => {
    const malformed = `${'Long insight '.repeat(40)}**unfinished`;
    const model = modelWithInsights(malformed);
    render(<PersonalizedInsights insights={model.insights} />);

    expect(screen.getByText(/Long insight Long insight/)).toBeVisible();
    expect(screen.getByText(/unfinished/)).toBeVisible();
  });

  it('shows an honest empty state when the backend supplies no insight text', () => {
    const model = modelWithInsights('');
    render(<PersonalizedInsights insights={model.insights} />);

    expect(screen.getByText('No personalized insights were provided for this assessment.'))
      .toBeVisible();
  });

  it('contains wide authored tables in a labelled keyboard-scrollable region', () => {
    const model = modelWithInsights(`### COVER OPTIONS
| Cover | Reason |
| --- | --- |
| Income protection | Supports irregular earnings |`);
    render(<PersonalizedInsights insights={model.insights} />);

    const tableRegion = screen.getByRole('region', { name: 'COVER OPTIONS details' });
    expect(tableRegion).toHaveAttribute('tabindex', '0');
    expect(within(tableRegion).getByRole('table', { name: 'COVER OPTIONS details' })).toBeVisible();
    expect(within(tableRegion).getByText('Supports irregular earnings')).toBeVisible();
  });

  it('omits unsupported inferred labels and metrics', () => {
    const model = modelWithInsights('A concise backend-authored assessment insight.');
    render(<PersonalizedInsights insights={model.insights} />);

    expect(screen.queryByText(/industry comparison|plans needed|critical gaps|generated just now/i))
      .not.toBeInTheDocument();
  });
});
