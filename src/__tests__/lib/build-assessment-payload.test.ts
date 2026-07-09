import { describe, expect, it } from 'vitest';
import { buildAssessmentPayload } from '@/lib/risk/build-assessment-payload';

const validAnswers: Record<string, unknown> = {
  first_name: 'Toni',
  last_name: 'Adeyemi',
  date_of_birth: '15/06/1995',
  gender: 'female',
  state: 'Lagos',
  city: 'Ikeja',
  occupation: 'tech_freelancer',
  marital_status: 'single',
  job_type: 'Web Development',
  freelance_duration: '3-5 years',
  client_geography: 'Global',
  work_mode: 'Fully remote',
  weekly_hours: '20-40',
  monthly_income_band: '₦300,000-₦500,000',
  income_stability: 'Somewhat stable',
  income_sources: '2-3',
  biggest_client_loss: '25-50%',
  past_risks: ['Late payments'],
  top_worries: ['Income interruption'],
  equipment_dependency: 'High',
  pre_existing_conditions: 'false',
  chronic_illness: 'true',
  smoker: false,
  health_rating: 4,
  travel_frequency: 'Occasionally',
  survival_3_months: 'Yes',
  savings_duration: '3 months',
  insurance_types: [],
  insurance_claims: 'None',
  protection_priority: 'Income protection',
};

describe('buildAssessmentPayload', () => {
  it('builds the exact validated API payload without mutating answers', () => {
    const snapshot = structuredClone(validAnswers);
    const payload = buildAssessmentPayload(validAnswers, 'tech_freelancer');

    expect(payload).toEqual({
      ...validAnswers,
      pre_existing_conditions: false,
      chronic_illness: true,
      smoker: false,
    });
    expect(validAnswers).toEqual(snapshot);
    expect(payload).not.toHaveProperty('email');
  });

  it('rejects category and occupation mismatches', () => {
    expect(() => buildAssessmentPayload(validAnswers, 'creative_freelancer')).toThrow(
      /category must match payload occupation/i
    );
  });

  it.each([
    { field: 'health_rating', value: undefined },
    { field: 'health_rating', value: '4' },
    { field: 'pre_existing_conditions', value: 'not-a-boolean' },
    { field: 'first_name', value: '' },
  ])('rejects invalid $field instead of manufacturing a fallback', ({ field, value }) => {
    expect(() => buildAssessmentPayload({ ...validAnswers, [field]: value }, 'tech_freelancer'))
      .toThrow();
  });

  it('rejects fields outside the assessment contract', () => {
    expect(() => buildAssessmentPayload({
      ...validAnswers,
      email: 'should-not-be-submitted@example.com',
    }, 'tech_freelancer')).toThrow();
  });
});
