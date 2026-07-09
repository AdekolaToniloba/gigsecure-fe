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

  // Payments
  http.post(`${BASE}/api/v1/payments/initialize`, () =>
    HttpResponse.json({ payment_id: 'pay-001', authorization_url: 'https://paystack.com/pay/test', reference: 'GS_TEST_001' })
  ),
  http.get(`${BASE}/api/v1/payments/:id`, ({ params }) =>
    HttpResponse.json({ id: params.id, user_id: '00000000-0000-0000-0000-000000000000', policy_id: 'pol-001', status: 'success', amount: 5000, currency: 'NGN', created_at: new Date().toISOString() })
  ),
  http.get(`${BASE}/api/v1/payments/history`, () => HttpResponse.json([])),
];
