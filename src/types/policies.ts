import type { components } from './schema';

export type Policy = components['schemas']['PolicyOut'];
export type PolicyListResponse = components['schemas']['PolicyListResponse'];
export type PolicyProductSummary = components['schemas']['PolicyProductSummary'];
export type PolicySummary = components['schemas']['PolicySummary'];
export type CreatePolicyRequest = components['schemas']['PolicyCreate'];

export type PolicyStatusFilter = 'active' | 'expired';
export type PremiumsFilter = 'all' | 'active' | 'due-soon' | 'expired';
