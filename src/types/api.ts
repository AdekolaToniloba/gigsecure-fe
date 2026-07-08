// ─── Re-exports from generated schema ────────────────────────────
import type { components } from './schema';

export type TokenResponse = components['schemas']['TokenResponse'];
export type UserResponse = components['schemas']['UserResponse'];
export type UserWithProfileResponse = components['schemas']['UserWithProfileResponse'];
export type UserProfileResponse = components['schemas']['UserProfileResponse'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type WaitlistSignupRequest = components['schemas']['WaitlistSignupRequest'];
export type {
  BackendTokenResponse,
  BrowserTokenResponse,
  RegisterResponse as AuthRegisterResponse,
} from './auth';

// ─── Error parsing ───────────────────────────────────────────────

export type ApiValidationDetail = {
  loc: Array<string | number>;
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
};

export type ApiFieldErrors = Record<string, string[]>;

export type ParsedApiError = {
  message: string;
  statusCode?: number;
  fieldErrors: ApiFieldErrors;
  details?: ApiValidationDetail[];
  raw?: unknown;
};

// ─── Generated risk contract aliases ──────────────────────────────────────

export type PillarScores = components['schemas']['PillarScores'];

export type AssessmentResponse = components['schemas']['AssessmentResponse'];
export type AssessmentSummary = components['schemas']['AssessmentSummary'];

export type TechAssessmentInput = components['schemas']['TechAssessmentInput'];

export interface WaitlistSignupResponse {
  message: string;
  user_id: string;
  access_token: string;
  token_type: string;
}
