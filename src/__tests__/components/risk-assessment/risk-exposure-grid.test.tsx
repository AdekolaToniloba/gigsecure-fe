import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockAssessmentResponse } from '@/__tests__/fixtures/mockAssessmentResponse';
import { RiskExposureCard } from '@/components/risk-assessment/report/risk-exposure-card';
import { RiskExposureGrid } from '@/components/risk-assessment/report/risk-exposure-grid';
import {
  createRiskReportDisplayModel,
  RISK_PILLAR_LABELS,
  type RiskExposureDisplay,
} from '@/lib/risk/report-display-model';

describe('RiskExposureGrid', () => {
  it('renders exactly the five contract-backed pillars in stable order', () => {
    const report = createRiskReportDisplayModel(mockAssessmentResponse);
    render(<RiskExposureGrid exposures={report.exposures} />);

    const region = screen.getByRole('region', { name: 'Risk exposure breakdown' });
    const cards = within(region).getAllByRole('article');

    expect(cards).toHaveLength(5);
    expect(cards.map((card) => within(card).getByRole('heading').textContent)).toEqual([
      RISK_PILLAR_LABELS.income,
      RISK_PILLAR_LABELS.client,
      RISK_PILLAR_LABELS.safety,
      RISK_PILLAR_LABELS.equipment,
      RISK_PILLAR_LABELS.health,
    ]);
  });

  it('renders safe numeric bars at score and rounding boundaries', () => {
    const report = createRiskReportDisplayModel({
      ...mockAssessmentResponse,
      pillar_scores: {
        income: 0,
        client: 0.4,
        safety: 49.5,
        equipment: 99.5,
        health: 100,
      },
    });
    render(<RiskExposureGrid exposures={report.exposures} />);

    const bars = screen.getAllByRole('progressbar');
    expect(bars.map((bar) => bar.getAttribute('aria-valuenow'))).toEqual([
      '0',
      '0.4',
      '49.5',
      '99.5',
      '100',
    ]);
    expect(bars.map((bar) => bar.getAttribute('aria-valuetext'))).toEqual([
      '0 out of 100',
      '0 out of 100',
      '50 out of 100',
      '100 out of 100',
      '100 out of 100',
    ]);
    expect(bars[0].firstElementChild).toHaveStyle({ width: '0%' });
    expect(bars[4].firstElementChild).toHaveStyle({ width: '100%' });
  });

  it('uses numeric labels only and omits unsupported classifications and prose', () => {
    const report = createRiskReportDisplayModel(mockAssessmentResponse);
    render(<RiskExposureGrid exposures={report.exposures} />);

    expect(screen.getByText('72', { selector: 'p' })).toHaveTextContent('72 out of 100');
    expect(screen.queryByText(/low risk|moderate risk|high risk/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/benchmark|covered freelancers|critical gap|description/i))
      .not.toBeInTheDocument();
  });

  it('wraps long labels and exposes one, two, and three-column responsive grid contracts', () => {
    const longExposure: RiskExposureDisplay = {
      key: 'income',
      label: `Income stability ${'for independent specialists '.repeat(12)}`.trim(),
      score: 55,
      roundedScore: 55,
      scoreText: 'Long income stability label: 55 out of 100',
    };
    const { rerender } = render(<RiskExposureCard exposure={longExposure} />);

    expect(screen.getByRole('heading', { name: longExposure.label })).toHaveClass(
      'break-words',
      '[overflow-wrap:anywhere]',
    );

    const report = createRiskReportDisplayModel(mockAssessmentResponse);
    rerender(<RiskExposureGrid exposures={report.exposures} />);
    expect(screen.getByRole('region', { name: 'Risk exposure breakdown' }).lastElementChild)
      .toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'xl:grid-cols-3', 'min-w-0');
  });
});
