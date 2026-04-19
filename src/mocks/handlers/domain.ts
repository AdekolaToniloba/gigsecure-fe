import { http, HttpResponse } from 'msw';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const mockProducts = [
  {
    id: 'prod-001',
    name: 'Income Protection',
    description: 'Protects your income when you cannot work',
    category: 'income',
    price: 5000,
    currency: 'NGN',
    provider: 'GigSecure',
    featured: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Equipment Cover',
    description: 'Cover for your work equipment',
    category: 'equipment',
    price: 2500,
    currency: 'NGN',
    provider: 'GigSecure',
    featured: false,
    created_at: new Date().toISOString(),
  },
];

const mockPolicies = [
  {
    id: 'pol-001',
    user_id: '00000000-0000-0000-0000-000000000000',
    product_id: 'prod-001',
    status: 'active',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    premium: 5000,
    currency: 'NGN',
    created_at: new Date().toISOString(),
  },
];

const mockClaims = [
  {
    id: 'claim-001',
    user_id: '00000000-0000-0000-0000-000000000000',
    policy_id: 'pol-001',
    status: 'pending',
    description: 'Unable to work due to illness',
    amount_claimed: 50000,
    amount_approved: null,
    currency: 'NGN',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const domainHandlers = [
  // Products
  http.get(`${BASE}/api/v1/products/`, () => HttpResponse.json(mockProducts)),
  http.get(`${BASE}/api/v1/products/featured`, () =>
    HttpResponse.json(mockProducts.filter((p) => p.featured))
  ),
  http.get(`${BASE}/api/v1/products/:id`, ({ params }) => {
    const product = mockProducts.find((p) => p.id === params.id);
    if (!product) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(product);
  }),

  // Policies
  http.get(`${BASE}/api/v1/policies/`, () => HttpResponse.json(mockPolicies)),
  http.get(`${BASE}/api/v1/policies/:id`, ({ params }) => {
    const policy = mockPolicies.find((p) => p.id === params.id);
    if (!policy) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(policy);
  }),
  http.post(`${BASE}/api/v1/policies/`, () => HttpResponse.json(mockPolicies[0], { status: 201 })),
  http.post(`${BASE}/api/v1/policies/:id/cancel`, ({ params }) =>
    HttpResponse.json({ ...mockPolicies[0], id: params.id as string, status: 'cancelled' })
  ),
  http.post(`${BASE}/api/v1/policies/:id/renew`, ({ params }) =>
    HttpResponse.json({ ...mockPolicies[0], id: params.id as string })
  ),

  // Claims
  http.get(`${BASE}/api/v1/claims/`, () => HttpResponse.json(mockClaims)),
  http.get(`${BASE}/api/v1/claims/:id`, ({ params }) => {
    const claim = mockClaims.find((c) => c.id === params.id);
    if (!claim) return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    return HttpResponse.json(claim);
  }),
  http.get(`${BASE}/api/v1/claims/:id/status`, ({ params }) =>
    HttpResponse.json({ claim_id: params.id, status: 'pending', updated_at: new Date().toISOString() })
  ),
  http.post(`${BASE}/api/v1/claims/`, () => HttpResponse.json(mockClaims[0], { status: 201 })),

  // Risk — questions (real shape)
  http.get(`${BASE}/api/v1/risk/questions`, () =>
    HttpResponse.json({
      category: 'tech_freelancer',
      title: 'Risk Assessment for Tech Freelancers',
      description: 'Evaluate your risk exposure as a tech freelancer',
      steps: [
        { step: 1, title: 'You & your work', subtitle: 'Role details', questions: [
          { id: 'job_type', text: 'What type of tech freelancing do you do?', type: 'single_choice', options: ['Web Development', 'Mobile Development'] },
        ]},
        { step: 2, title: 'Income & stability', subtitle: 'Earnings', questions: [
          { id: 'monthly_income_band', text: 'What is your average monthly income?', type: 'single_choice', options: ['Under ₦100k', '₦100k-₦500k'] },
        ]},
        { step: 3, title: 'Your risks', subtitle: 'Work hazards', questions: [
          { id: 'past_risks', text: 'Which risks have you experienced?', type: 'multi_choice', options: ['Late payments', 'Equipment failure'] },
        ]},
        { step: 4, title: 'Health & lifestyle', subtitle: 'Wellbeing', consent_required: true, consent_text: 'I agree to provide basic health information.', questions: [
          { id: 'pre_existing_conditions', text: 'Pre-existing conditions?', type: 'boolean' },
        ]},
        { step: 5, title: 'Safety net & history', subtitle: 'Coverage', questions: [
          { id: 'survival_3_months', text: 'Could you survive 3 months?', type: 'single_choice', options: ['Yes', 'No'] },
        ]},
      ],
    })
  ),
  http.get(`${BASE}/api/v1/risk/assessment`, () =>
    HttpResponse.json({ id: 'assess-001', user_id: '00000000-0000-0000-0000-000000000001', score: { score: 72, level: 'medium' }, completed_at: new Date().toISOString() })
  ),
  http.post(`${BASE}/api/v1/risk/assessment`, () =>
    HttpResponse.json({ id: 'assess-002', user_id: '00000000-0000-0000-0000-000000000001', score: { score: 72, level: 'medium' }, completed_at: new Date().toISOString() })
  ),
  // Risk — tech freelancer assessment submission (real shape)
  http.post(`${BASE}/api/v1/risk/assessment/tech_freelancer`, () =>
    HttpResponse.json({
      overall_score: 68.5,
      risk_profile: 'Moderate Risk',
      pillar_scores: { income: 72, client: 45, safety: 80, equipment: 35, health: 55 },
      recommendations: ['Consider income protection insurance'],
      ai_insights: 'PERSONALIZED INSIGHTS\n\n- **Income Vulnerability:** Moderate income stability.\n- **Equipment Dependency:** Very dependent on equipment.',
    })
  ),
  http.get(`${BASE}/api/v1/risk/recommendations`, () =>
    HttpResponse.json([{ product_id: 'prod-001', reason: 'High income volatility detected', priority: 1 }])
  ),
  http.get(`${BASE}/api/v1/risk/categories`, () =>
    HttpResponse.json([
      { id: 'cat-001', name: 'Tech Freelancer', slug: 'tech_freelancer' },
      { id: 'cat-002', name: 'Creative Freelancer', slug: 'creative_freelancer' },
    ])
  ),

  // Auth — waitlist signup
  http.post('/api/auth/waitlist', () =>
    HttpResponse.json({
      message: 'Successfully joined waitlist',
      user_id: 'test-user-id-001',
      access_token: 'mock-access-token-xyz',
      token_type: 'bearer',
    })
  ),

  // Payments
  http.post(`${BASE}/api/v1/payments/initialize`, () =>
    HttpResponse.json({ payment_id: 'pay-001', authorization_url: 'https://paystack.com/pay/test', reference: 'GS_TEST_001' })
  ),
  http.get(`${BASE}/api/v1/payments/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, user_id: '00000000-0000-0000-0000-000000000000', policy_id: 'pol-001', status: 'success', amount: 5000, currency: 'NGN', created_at: new Date().toISOString() })
  ),
  http.get(`${BASE}/api/v1/payments/history`, () => HttpResponse.json([])),
];
