import { describe, expect, it } from 'vitest';
import {
  policiesListResponseSchema,
  policySchema,
  policySummarySchema,
} from '@/lib/validators/policies';
import {
  emptyPolicySummaryFixture,
  malformedPolicyFixture,
  policyFixtures,
  policyListFixture,
  policySummaryFixture,
} from '@/mocks/fixtures/policies';

describe('policy validators', () => {
  it('accepts OpenAPI-shaped policy list, summary, and detail payloads', () => {
    expect(policiesListResponseSchema.parse(policyListFixture).items).toHaveLength(3);
    expect(policySummarySchema.parse(policySummaryFixture)).toEqual(policySummaryFixture);
    expect(policySchema.parse(policyFixtures[0])).toMatchObject({
      id: 'pol-income-active',
      product: { provider_name: 'AXA Mansard' },
    });
  });

  it('keeps decimal money fields as strings at the API boundary', () => {
    const parsed = policySchema.parse(policyFixtures[0]);

    expect(parsed.coverage_amount).toBe('350000');
    expect(parsed.premium_amount).toBe('9500');
    expect(typeof parsed.coverage_amount).toBe('string');
  });

  it('accepts nullable optional policy dates and document identifiers', () => {
    const parsed = policySchema.parse(policyFixtures[1]);

    expect(parsed.purchased_at).toBeNull();
    expect(parsed.external_policy_id).toBeNull();
  });

  it('renders zero-safe summaries without requiring a currency field', () => {
    expect(policySummarySchema.parse(emptyPolicySummaryFixture)).toEqual({
      total_coverage: '0',
      active_count: 0,
      due_soon_count: 0,
    });
  });

  it('rejects stale legacy policy response shapes', () => {
    expect(() => policiesListResponseSchema.parse(malformedPolicyFixture)).toThrow();
  });

  it('rejects invalid summary values and non-decimal strings', () => {
    expect(() =>
      policySummarySchema.parse({
        total_coverage: 'NGN 20,000',
        active_count: -1,
        due_soon_count: 1.5,
      })
    ).toThrow();
  });
});
