import { parseInsights, type InsightBlock } from '@/app/(wizard)/assessment/_lib/parseInsights';
import { riskAssessmentResponseSchema } from '@/lib/validators/risk';
import type { AssessmentResponse, PillarScores } from '@/types/api';

export const RISK_PILLAR_LABELS = {
  income: 'Income stability',
  client: 'Client concentration',
  safety: 'Safety-net strength',
  equipment: 'Equipment dependency',
  health: 'Health and lifestyle',
} as const satisfies Record<keyof PillarScores, string>;

const PILLAR_ORDER = ['income', 'client', 'safety', 'equipment', 'health'] as const;

export type RiskExposureDisplay = {
  key: keyof PillarScores;
  label: string;
  score: number;
  roundedScore: number;
  scoreText: string;
};

export type RiskReportDisplayModel = {
  applicant: {
    firstName: string;
    lastName: string;
    fullName: string;
    age: number;
    gender: string;
    maritalStatus: string;
    state: string;
    city: string;
  };
  category: string;
  score: {
    raw: number;
    rounded: number;
    percentageText: string;
    accessibleText: string;
  };
  riskProfile: string;
  exposures: RiskExposureDisplay[];
  advice: string[];
  recommendedCategories: string[];
  insights: {
    rawText: string;
    blocks: InsightBlock[];
  };
};

export function formatRiskScore(score: number): number {
  return Math.round(score);
}

function parseInsightsSafely(rawText: string): InsightBlock[] {
  const fallbackText = rawText.trim();

  try {
    const blocks = parseInsights(rawText);
    if (blocks.length > 0 || !fallbackText) return blocks;
  } catch {
    // Fall through to readable plain text. Authored insight content must never
    // make the otherwise valid assessment report unusable.
  }

  return fallbackText ? [{ type: 'paragraph', text: fallbackText }] : [];
}

export function createRiskReportDisplayModel(input: unknown): RiskReportDisplayModel {
  const response: AssessmentResponse = riskAssessmentResponseSchema.parse(input);
  const roundedScore = formatRiskScore(response.overall_score);

  return {
    applicant: {
      firstName: response.applicant.first_name,
      lastName: response.applicant.last_name,
      fullName: `${response.applicant.first_name} ${response.applicant.last_name}`.trim(),
      age: response.applicant.age,
      gender: response.applicant.gender,
      maritalStatus: response.applicant.marital_status,
      state: response.applicant.state,
      city: response.applicant.city,
    },
    category: response.category,
    score: {
      raw: response.overall_score,
      rounded: roundedScore,
      percentageText: `${roundedScore}%`,
      accessibleText: `${roundedScore} out of 100. ${response.risk_profile}`,
    },
    riskProfile: response.risk_profile,
    exposures: PILLAR_ORDER.map((key) => {
      const score = response.pillar_scores[key];
      const rounded = formatRiskScore(score);
      const label = RISK_PILLAR_LABELS[key];
      return {
        key,
        label,
        score,
        roundedScore: rounded,
        scoreText: `${label}: ${rounded} out of 100`,
      };
    }),
    advice: [...response.recommendations],
    recommendedCategories: [...(response.recommended_categories ?? [])],
    insights: {
      rawText: response.ai_insights,
      blocks: parseInsightsSafely(response.ai_insights),
    },
  };
}
