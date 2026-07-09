import type { Policy, PolicyListResponse, PolicySummary } from '@/types/policies';

export const policyFixtures: Policy[] = [
  {
    id: 'pol-income-active',
    status: 'active',
    display_status: 'Active',
    coverage_amount: '350000',
    premium_amount: '9500',
    premium_currency: 'NGN',
    renewal_frequency: 'monthly',
    start_date: '2026-06-01',
    end_date: '2027-06-01',
    purchased_at: '2026-06-01T09:00:00Z',
    external_policy_id: 'AXA-GIG-001',
    created_at: '2026-06-01T08:45:00Z',
    product: {
      id: 'prod-income',
      name: 'Income Shield for Gig Workers',
      category: 'Income Protection',
      provider_name: 'AXA Mansard',
      provider_slug: 'axa-mansard',
    },
  },
  {
    id: 'pol-equipment-due',
    status: 'active',
    display_status: 'Due Soon',
    coverage_amount: '250000',
    premium_amount: '6200',
    premium_currency: 'NGN',
    renewal_frequency: 'monthly',
    start_date: '2026-05-15',
    end_date: '2027-05-15',
    purchased_at: null,
    external_policy_id: null,
    created_at: '2026-05-15T10:30:00Z',
    product: {
      id: 'prod-equipment',
      name: 'Equipment Protection Plus',
      category: 'Equipment Protection',
      provider_name: 'Leadway Assurance',
      provider_slug: 'leadway',
    },
  },
  {
    id: 'pol-health-expired',
    status: 'expired',
    display_status: 'Expired',
    coverage_amount: '90000',
    premium_amount: '4300',
    premium_currency: 'NGN',
    renewal_frequency: 'monthly',
    start_date: '2025-05-01',
    end_date: '2026-05-01',
    purchased_at: '2025-05-01T12:00:00Z',
    external_policy_id: 'ZUR-HLT-009',
    created_at: '2025-05-01T11:45:00Z',
    product: {
      id: 'prod-health',
      name: 'Flexible Health Support',
      category: 'Health Protection',
      provider_name: 'Zurich Nigeria',
      provider_slug: 'zurich',
    },
  },
];

export const policyListFixture: PolicyListResponse = {
  items: policyFixtures,
};

export const emptyPolicyListFixture: PolicyListResponse = {
  items: [],
};

export const policySummaryFixture: PolicySummary = {
  total_coverage: '690000',
  active_count: 2,
  due_soon_count: 1,
};

export const emptyPolicySummaryFixture: PolicySummary = {
  total_coverage: '0',
  active_count: 0,
  due_soon_count: 0,
};

export const malformedPolicyFixture = {
  items: [
    {
      id: 'pol-stale-shape',
      user_id: '00000000-0000-0000-0000-000000000000',
      product_id: 'prod-income',
      status: 'active',
      premium: 9500,
      currency: 'NGN',
    },
  ],
};
