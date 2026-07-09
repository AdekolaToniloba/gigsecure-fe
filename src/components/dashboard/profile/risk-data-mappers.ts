import { createRiskReportDisplayModel } from '@/lib/risk/report-display-model';
import type { AssessmentResponse } from '@/types/api';
import type { ProfileResponse } from '@/types/profile';
import {
  formatFieldValue,
  formatProfileAmount,
  getProfileFallbackText,
} from './profile-formatters';

type RiskDataRow = {
  label: string;
  value: string;
  unavailable?: boolean;
};

export type RiskDataCardModel = {
  key: string;
  title: string;
  subtitle: string;
  rows: RiskDataRow[];
};

function unavailable(label: string): RiskDataRow {
  return {
    label,
    value: 'Not available from the current assessment summary.',
    unavailable: true,
  };
}

export function mapRiskDataCards(
  profileResponse: ProfileResponse,
  assessment: AssessmentResponse,
): RiskDataCardModel[] {
  const report = createRiskReportDisplayModel(assessment);
  const profile = profileResponse.profile;

  return [
    {
      key: 'personal-details',
      title: 'Personal details',
      subtitle: 'Latest personal details echoed back by your completed assessment.',
      rows: [
        { label: 'First name', value: report.applicant.firstName },
        { label: 'Last name', value: report.applicant.lastName },
        { label: 'Age', value: String(report.applicant.age) },
        { label: 'Gender', value: report.applicant.gender },
        { label: 'Marital status', value: report.applicant.maritalStatus },
        { label: 'City', value: report.applicant.city },
        { label: 'State', value: report.applicant.state },
      ],
    },
    {
      key: 'your-work',
      title: 'You & your work',
      subtitle: 'Current work data supported by your assessment summary and profile.',
      rows: [
        { label: 'Assessment category', value: assessment.category },
        { label: 'Occupation', value: getProfileFallbackText(profile?.occupation) },
        { label: 'Gig platform', value: getProfileFallbackText(profile?.gig_platform) },
        unavailable('Work mode'),
        unavailable('Weekly hours'),
      ],
    },
    {
      key: 'income-stability',
      title: 'Income & stability',
      subtitle: 'Available score and profile data that may influence your income resilience.',
      rows: [
        { label: 'Overall score', value: report.score.percentageText },
        {
          label: 'Income stability score',
          value: `${report.exposures.find((exposure) => exposure.key === 'income')?.roundedScore ?? 0} out of 100`,
        },
        { label: 'Average monthly income', value: formatProfileAmount(profile?.average_monthly_income) },
        { label: 'Years of experience', value: formatFieldValue('years_of_experience', profile?.years_of_experience) },
        unavailable('Income sources'),
      ],
    },
    {
      key: 'your-risks',
      title: 'Your risks',
      subtitle: 'Supported risk signals from your latest report.',
      rows: [
        { label: 'Risk profile', value: report.riskProfile },
        {
          label: 'Client concentration score',
          value: `${report.exposures.find((exposure) => exposure.key === 'client')?.roundedScore ?? 0} out of 100`,
        },
        {
          label: 'Equipment dependency score',
          value: `${report.exposures.find((exposure) => exposure.key === 'equipment')?.roundedScore ?? 0} out of 100`,
        },
        unavailable('Past risk events'),
        unavailable('Top worries'),
      ],
    },
    {
      key: 'health-lifestyle',
      title: 'Health & lifestyle',
      subtitle: 'Only the contracted health score is currently available here.',
      rows: [
        {
          label: 'Health score',
          value: `${report.exposures.find((exposure) => exposure.key === 'health')?.roundedScore ?? 0} out of 100`,
        },
        unavailable('Travel frequency'),
        unavailable('Pre-existing conditions'),
        unavailable('Smoking status'),
        unavailable('Health rating'),
      ],
    },
    {
      key: 'safety-net-history',
      title: 'Safety net & insurance history',
      subtitle: 'Current summary support for savings and insurance-related resilience.',
      rows: [
        {
          label: 'Safety-net strength score',
          value: `${report.exposures.find((exposure) => exposure.key === 'safety')?.roundedScore ?? 0} out of 100`,
        },
        unavailable('Savings duration'),
        unavailable('Insurance coverage'),
        unavailable('Insurance claims'),
        unavailable('Protection priority'),
      ],
    },
  ];
}
