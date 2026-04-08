import { describe, it, expect } from 'vitest';
import { parseInsights } from '@/app/(wizard)/assessment/_lib/parseInsights';
import {
  INSIGHTS_STANDARD,
  INSIGHTS_EM_DASH,
  INSIGHTS_EXTRA_WHITESPACE,
  INSIGHTS_EMPTY,
  INSIGHTS_NO_HEADERS,
} from '../fixtures/mockInsightsRaw';

describe('parseInsights', () => {
  it('identifies ALL CAPS lines as section-header', () => {
    const result = parseInsights('PERSONALIZED INSIGHTS');
    expect(result).toEqual([{ type: 'section-header', text: 'PERSONALIZED INSIGHTS' }]);
  });

  it('parses "- **Label:** body" format as insight-item', () => {
    const result = parseInsights('- **Income Vulnerability:** Your income is moderate.');
    expect(result).toEqual([
      { type: 'insight-item', label: 'Income Vulnerability', body: 'Your income is moderate.' },
    ]);
  });

  it('parses "- **Label** – body" (em-dash) format as insight-item', () => {
    const result = parseInsights('- **Financial Pressure** – With limited savings, you may struggle.');
    expect(result).toEqual([
      { type: 'insight-item', label: 'Financial Pressure', body: 'With limited savings, you may struggle.' },
    ]);
  });

  it('treats regular text lines as paragraph', () => {
    const result = parseInsights('Based on your profile, we recommend prioritizing income protection.');
    expect(result).toEqual([
      { type: 'paragraph', text: 'Based on your profile, we recommend prioritizing income protection.' },
    ]);
  });

  it('filters out empty lines', () => {
    const result = parseInsights('Line one\n\n\nLine two');
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'paragraph', text: 'Line one' });
    expect(result[1]).toEqual({ type: 'paragraph', text: 'Line two' });
  });

  it('returns empty array for empty string', () => {
    const result = parseInsights(INSIGHTS_EMPTY);
    expect(result).toEqual([]);
  });

  it('preserves correct order on mixed content (standard fixture)', () => {
    const result = parseInsights(INSIGHTS_STANDARD);
    // First non-empty line is "PERSONALIZED INSIGHTS"
    expect(result[0]).toEqual({ type: 'section-header', text: 'PERSONALIZED INSIGHTS' });
    // Should contain insight items
    const items = result.filter((b) => b.type === 'insight-item');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // Find RISK FACTORS section header
    const riskFactorsIdx = result.findIndex(
      (b) => b.type === 'section-header' && b.text === 'RISK FACTORS'
    );
    expect(riskFactorsIdx).toBeGreaterThan(0);
    // Should end with a paragraph
    expect(result[result.length - 1].type).toBe('paragraph');
  });

  it('treats single-asterisk lines as paragraph (not insight-item)', () => {
    const result = parseInsights('- *Not bold* just italic');
    expect(result[0].type).toBe('paragraph');
  });

  it('trims extra leading/trailing whitespace', () => {
    const result = parseInsights(INSIGHTS_EXTRA_WHITESPACE);
    // "PERSONALIZED INSIGHTS" should still be detected after trim
    const header = result.find((b) => b.type === 'section-header');
    expect(header).toEqual({ type: 'section-header', text: 'PERSONALIZED INSIGHTS' });
  });

  it('handles content with no section headers (just bullets)', () => {
    const result = parseInsights(INSIGHTS_NO_HEADERS);
    expect(result).toHaveLength(2);
    result.forEach((block) => {
      expect(block.type).toBe('insight-item');
    });
  });

  it('handles em-dash variant fixture correctly', () => {
    const result = parseInsights(INSIGHTS_EM_DASH);
    const header = result.find((b) => b.type === 'section-header');
    expect(header).toEqual({ type: 'section-header', text: 'KEY FINDINGS' });
    const items = result.filter((b) => b.type === 'insight-item');
    expect(items).toHaveLength(2);
  });

  it('does not crash on unexpected format', () => {
    const result = parseInsights('***weird*** format\n---\n===');
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
