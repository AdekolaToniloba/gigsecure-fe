import { delay, http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export const marketplaceProducts = [
  ['prod-income', 'Income Shield for Gig Workers', 'Income Protection', 'axa-mansard', 'AXA Mansard', '9500', '130000', 'low'],
  ['prod-equipment', 'Equipment Protection Plus', 'Equipment Protection', 'leadway', 'Leadway Assurance', '6200', '250000', 'moderate'],
  ['prod-liability', 'Freelancer Liability Cover', 'Liability Protection', 'coronation', 'Coronation Insurance', '7800', '180000', 'high'],
  ['prod-health', 'Flexible Health Support', 'Health Protection', 'zurich', 'Zurich Nigeria', '4300', '90000', 'low'],
  ['prod-income-plus', 'Income Shield Plus', 'Income Protection', 'leadway', 'Leadway Assurance', '12500', '300000', 'moderate'],
].map(([id, name, category, slug, providerName, premium, coverage, risk]) => ({
  id,
  name,
  category,
  description: `${category} that provides financial support when unexpected events interrupt your work.`,
  premium_amount: premium,
  premium_currency: 'NGN',
  coverage_amount: coverage,
  renewal_frequency: 'monthly',
  risk_level: risk,
  is_active: true,
  provider: { id: `provider-${slug}`, slug, name: providerName, logo_url: null },
}));

function matchesRepeated(search: URLSearchParams, key: string, value: string) {
  const selected = search.getAll(key);
  return selected.length === 0 || selected.includes(value);
}

const recommendationsUrl = `${BASE}/api/v1/marketplace/recommendations`;
export const MARKETPLACE_RECOMMENDATIONS_DELAY_MS = 120;

function hasBearerToken(request: Request): boolean {
  return /^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '');
}

function recommendationHandler(body: JsonBodyType, status = 200) {
  return http.get(recommendationsUrl, ({ request }) => {
    if (!hasBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    return HttpResponse.json(body, { status });
  });
}

export const marketplaceRecommendationHandlerScenarios = {
  success: recommendationHandler({
    recommended_categories: ['Income Protection', 'Equipment Protection'],
    items: marketplaceProducts.slice(0, 3),
  }),
  empty: recommendationHandler({ recommended_categories: [], items: [] }),
  malformed: recommendationHandler({ recommended_categories: 'Income Protection', items: null }),
  failure: recommendationHandler(
    { detail: 'Marketplace recommendations are temporarily unavailable.' },
    500
  ),
  delayed: http.get(recommendationsUrl, async ({ request }) => {
    if (!hasBearerToken(request)) {
      return HttpResponse.json({ detail: 'Not authenticated' }, { status: 401 });
    }
    await delay(MARKETPLACE_RECOMMENDATIONS_DELAY_MS);
    return HttpResponse.json({
      recommended_categories: ['Income Protection', 'Equipment Protection'],
      items: marketplaceProducts.slice(0, 3),
    });
  }),
} as const;

export const marketplaceHandlers = [
  http.get(`${BASE}/api/v1/marketplace/products`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase();
    const min = Number(url.searchParams.get('min_premium') ?? 0);
    const max = Number(url.searchParams.get('max_premium') ?? Number.MAX_SAFE_INTEGER);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const filtered = marketplaceProducts.filter((product) =>
      matchesRepeated(url.searchParams, 'category', product.category) &&
      matchesRepeated(url.searchParams, 'provider_slug', product.provider.slug) &&
      matchesRepeated(url.searchParams, 'risk_level', product.risk_level) &&
      (!q || product.name.toLowerCase().includes(q)) &&
      Number(product.premium_amount) >= min &&
      Number(product.premium_amount) <= max
    );
    return HttpResponse.json({
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    });
  }),
  marketplaceRecommendationHandlerScenarios.success,
  http.get(`${BASE}/api/v1/marketplace/products/:id`, ({ params }) => {
    const product = marketplaceProducts.find((item) => item.id === params.id);
    return product
      ? HttpResponse.json(product)
      : HttpResponse.json({ detail: 'Product not found' }, { status: 404 });
  }),
];
