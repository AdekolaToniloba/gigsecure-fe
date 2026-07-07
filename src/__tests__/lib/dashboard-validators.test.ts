import { describe, expect, it } from 'vitest';
import {
  dashboardOverviewSchema,
  incomeStabilityPatternSchema,
} from '@/lib/validators/dashboard';

describe('dashboard validators', () => {
  it('parses a nullable unassessed overview', () => {
    expect(dashboardOverviewSchema.parse({
      premiums_bought: 0,
      monthly_income_band: null,
      safety_buffer: null,
      recommended_plans_count: 0,
      income_stability: null,
      has_assessment: false,
    })).toEqual({
      premiums_bought: 0,
      monthly_income_band: null,
      safety_buffer: null,
      recommended_plans_count: 0,
      income_stability: null,
      has_assessment: false,
    });
  });

  it('parses a populated assessed overview without restricting backend classifications', () => {
    const result = dashboardOverviewSchema.parse({
      premiums_bought: 2,
      monthly_income_band: '₦300,000–₦500,000',
      safety_buffer: '3 months',
      recommended_plans_count: 4,
      income_stability: {
        score: 42,
        classification: 'backend-defined classification',
        graph_points: [12.5, 9, 18.25],
      },
      has_assessment: true,
    });

    expect(result.income_stability?.graph_points).toEqual([12.5, 9, 18.25]);
  });

  it.each([
    { premiums_bought: -1 },
    { premiums_bought: 1.5 },
    { recommended_plans_count: -1 },
    { recommended_plans_count: 2.5 },
  ])('rejects invalid count fields: %o', (override) => {
    expect(dashboardOverviewSchema.safeParse({
      premiums_bought: 0,
      recommended_plans_count: 0,
      has_assessment: false,
      ...override,
    }).success).toBe(false);
  });

  it('rejects non-array graph points', () => {
    expect(incomeStabilityPatternSchema.safeParse({
      score: 42,
      classification: 'Moderate',
      graph_points: '12,18,24',
    }).success).toBe(false);
  });

  it('applies only the defaults documented by the dashboard contract', () => {
    expect(dashboardOverviewSchema.parse({})).toEqual({
      premiums_bought: 0,
      recommended_plans_count: 0,
      has_assessment: false,
    });
  });
});
