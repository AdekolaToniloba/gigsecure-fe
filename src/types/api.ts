// ─── Re-exports from generated schema ────────────────────────────
import type { components } from './schema';

export type TokenResponse = components['schemas']['TokenResponse'];
export type UserResponse = components['schemas']['UserResponse'];
export type UserWithProfileResponse = components['schemas']['UserWithProfileResponse'];
export type UserProfileResponse = components['schemas']['UserProfileResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type WaitlistSignupRequest = components['schemas']['WaitlistSignupRequest'];

// ─── Hand-maintained types (not in generated schema yet) ────────

export interface PillarScores {
  income: number;
  client: number;
  safety: number;
  equipment: number;
  health: number;
  [key: string]: number;
}

export interface AssessmentResponse {
  id: string;
  user_id: string;
  overall_score: number;
  risk_profile: string;
  ai_insights: string;
  recommendations: string[];
  pillar_scores: PillarScores;
  created_at?: string;
}

export interface TechAssessmentInput {
  job_type: string;
  freelance_duration: string;
  client_geography: string;
  work_mode: string;
  weekly_hours: string;
  monthly_income_band: string;
  income_stability: string;
  income_sources: string;
  biggest_client_loss: string;
  past_risks: string[];
  top_worries: string[];
  equipment_dependency: string;
  pre_existing_conditions: boolean;
  chronic_illness: boolean;
  smoker: boolean;
  health_rating: number;
  travel_frequency: string;
  survival_3_months: string;
  savings_duration: string;
  insurance_types: string[];
  insurance_claims: string;
  protection_priority: string;
}

export interface WaitlistSignupResponse {
  message: string;
  user_id: string;
  access_token: string;
  token_type: string;
}
