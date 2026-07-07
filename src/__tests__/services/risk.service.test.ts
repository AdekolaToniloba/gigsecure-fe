import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from '@/lib/api/endpoints';
import {
  assessmentHistoryFixture,
  latestAssessmentFixture,
} from '@/mocks/fixtures/dashboard';
import { server } from '@/mocks/server';
import { riskService } from '@/services/risk.service';
import { useAuthStore } from '@/store/auth-store';
import type { TechAssessmentInput } from '@/types/api';

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

beforeEach(() => {
  useAuthStore.getState().setSession({
    accessToken: 'risk-service-token',
    kycVerified: true,
    riskAssessed: true,
  });
});

describe('riskService', () => {
  it('loads and validates the latest assessment through the authenticated client', async () => {
    expect.assertions(2);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer risk-service-token');
        return HttpResponse.json(latestAssessmentFixture);
      })
    );

    await expect(riskService.getLatestAssessment()).resolves.toEqual(latestAssessmentFixture);
  });

  it('rejects malformed latest-assessment responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.ASSESSMENT}`, () =>
        HttpResponse.json({ ...latestAssessmentFixture, overall_score: 101 })
      )
    );

    await expect(riskService.getLatestAssessment()).rejects.toThrow(
      'Invalid API response shape in riskService.getLatestAssessment'
    );
  });

  it('submits the generated payload to the documented category endpoint and validates output', async () => {
    expect.assertions(4);
    const payload = createAssessmentPayload();
    const controller = new AbortController();

    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
        async ({ request }) => {
          expect(request.headers.get('authorization')).toBe('Bearer risk-service-token');
          expect(request.signal.aborted).toBe(false);
          expect(await request.json()).toEqual(payload);
          return HttpResponse.json(latestAssessmentFixture, { status: 201 });
        }
      )
    );

    await expect(riskService.submitTechAssessment(payload, controller.signal)).resolves.toEqual(
      latestAssessmentFixture
    );
  });

  it('rejects malformed category-submission responses', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.post(
        `${baseUrl}${ENDPOINTS.RISK.ASSESSMENT_BY_CATEGORY('tech_freelancer')}`,
        () => HttpResponse.json({ ...latestAssessmentFixture, pillar_scores: null }, { status: 201 })
      )
    );

    await expect(riskService.submitTechAssessment(createAssessmentPayload())).rejects.toThrow(
      'Invalid API response shape in riskService.submitTechAssessment'
    );
  });

  it('loads documented assessment summaries and rejects malformed history', async () => {
    await expect(riskService.getHistory()).resolves.toEqual(assessmentHistoryFixture);

    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(
      http.get(`${baseUrl}${ENDPOINTS.RISK.HISTORY}`, () =>
        HttpResponse.json([{ ...assessmentHistoryFixture[0], overall_score: -1 }])
      )
    );

    await expect(riskService.getHistory()).rejects.toThrow(
      'Invalid API response shape in riskService.getHistory'
    );
  });
});

function createAssessmentPayload(): TechAssessmentInput {
  return {
    first_name: 'Toni',
    last_name: 'Adeyemi',
    date_of_birth: '1995-06-15',
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
    pre_existing_conditions: false,
    chronic_illness: false,
    smoker: false,
    health_rating: 4,
    travel_frequency: 'Occasionally',
    survival_3_months: 'Yes',
    savings_duration: '3 months',
    insurance_types: [],
    insurance_claims: 'None',
    protection_priority: 'Income protection',
  };
}
