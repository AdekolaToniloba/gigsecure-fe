import { describe, expect, it } from 'vitest';
import { mockAssessmentResponse } from '@/__tests__/fixtures/mockAssessmentResponse';
import {
  createRiskReportDisplayModel,
  RISK_PILLAR_LABELS,
} from '@/lib/risk/report-display-model';

describe('risk report display model', () => {
  it('maps only contract-backed assessment values in a stable pillar order', () => {
    const model = createRiskReportDisplayModel(mockAssessmentResponse);

    expect(model.applicant.fullName).toBe('Toni Adeyemi');
    expect(model.score).toEqual({
      raw: 68.5,
      rounded: 69,
      percentageText: '69%',
      accessibleText: '69 out of 100. Moderate Risk',
    });
    expect(model.riskProfile).toBe('Moderate Risk');
    expect(model.exposures.map(({ key, label }) => ({ key, label }))).toEqual([
      { key: 'income', label: RISK_PILLAR_LABELS.income },
      { key: 'client', label: RISK_PILLAR_LABELS.client },
      { key: 'safety', label: RISK_PILLAR_LABELS.safety },
      { key: 'equipment', label: RISK_PILLAR_LABELS.equipment },
      { key: 'health', label: RISK_PILLAR_LABELS.health },
    ]);
    expect(model.exposures[0]).toMatchObject({
      score: 72,
      roundedScore: 72,
      scoreText: 'Income stability: 72 out of 100',
    });
    expect(model.advice).toEqual(mockAssessmentResponse.recommendations);
  });

  it('preserves long authored insight text and degrades malformed markdown to readable content', () => {
    const longText = `${'A'.repeat(500)} **unfinished`;
    const model = createRiskReportDisplayModel({
      ...mockAssessmentResponse,
      ai_insights: longText,
    });

    expect(model.insights.rawText).toBe(longText);
    expect(model.insights.blocks.length).toBeGreaterThan(0);
    expect(JSON.stringify(model.insights.blocks)).toContain('A'.repeat(100));
  });

  it('contains no unsupported report metrics or derived exposure classifications', () => {
    const model = createRiskReportDisplayModel(mockAssessmentResponse);

    expect(model).not.toHaveProperty('plansNeeded');
    expect(model).not.toHaveProperty('criticalGaps');
    expect(model).not.toHaveProperty('benchmark');
    expect(model).not.toHaveProperty('generatedAt');
    expect(model).not.toHaveProperty('lastUpdated');
    expect(model).not.toHaveProperty('monthlyEstimate');
    for (const exposure of model.exposures) {
      expect(exposure).not.toHaveProperty('riskLevel');
      expect(exposure).not.toHaveProperty('description');
    }
  });

  it('rejects malformed source data before mapping it', () => {
    expect(() => createRiskReportDisplayModel({
      ...mockAssessmentResponse,
      pillar_scores: { ...mockAssessmentResponse.pillar_scores, health: 101 },
    })).toThrow();
  });
});
