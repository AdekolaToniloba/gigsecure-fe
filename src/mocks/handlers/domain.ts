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
    user_id: '00000000-0000-0000-0000-000000000001',
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
    user_id: '00000000-0000-0000-0000-000000000001',
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

  // Risk
  http.get(`${BASE}/api/v1/risk/questions`, () =>
    HttpResponse.json([
      { id: 'q1', question: 'What is your primary source of income?', type: 'single_choice', options: ['Freelance', 'Gig apps', 'Both'], required: true },
      { id: 'q2', question: 'How many months can you survive without income?', type: 'single_choice', options: ['Less than 1', '1-2', '3-6', '6+'], required: true },
    ])
  ),
  http.get(`${BASE}/api/v1/risk/assessment`, () =>
    HttpResponse.json({ id: 'assess-001', user_id: '00000000-0000-0000-0000-000000000001', score: { score: 72, level: 'medium' }, completed_at: new Date().toISOString() })
  ),
  http.post(`${BASE}/api/v1/risk/assessment`, () =>
    HttpResponse.json({ id: 'assess-002', user_id: '00000000-0000-0000-0000-000000000001', score: { score: 72, level: 'medium' }, completed_at: new Date().toISOString() })
  ),
  http.get(`${BASE}/api/v1/risk/recommendations`, () =>
    HttpResponse.json([{ product_id: 'prod-001', reason: 'High income volatility detected', priority: 1 }])
  ),

  // Payments
  http.post(`${BASE}/api/v1/payments/initialize`, () =>
    HttpResponse.json({ payment_id: 'pay-001', authorization_url: 'https://paystack.com/pay/test', reference: 'GS_TEST_001' })
  ),
  http.get(`${BASE}/api/v1/payments/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, user_id: '00000000-0000-0000-0000-000000000001', policy_id: 'pol-001', status: 'success', amount: 5000, currency: 'NGN', created_at: new Date().toISOString() })
  ),
  http.get(`${BASE}/api/v1/payments/history`, () => HttpResponse.json([])),
];
