import { describe, expect, it } from 'vitest';
import {
  marketplaceFiltersSchema,
  productListResponseSchema,
  productSchema,
} from '@/lib/validators/marketplace';

const product = {
  id: 'prod-income',
  name: 'Income Shield',
  category: 'Income Protection',
  description: 'Protect your income.',
  premium_amount: '9500.00',
  premium_currency: 'NGN',
  coverage_amount: '130000',
  renewal_frequency: 'monthly',
  risk_level: null,
  is_active: true,
  provider: { id: 'provider-axa', slug: 'axa', name: 'AXA Mansard', logo_url: null },
};

describe('marketplace validators', () => {
  it('accepts product lists with nullable provider logos and risk levels', () => {
    expect(productListResponseSchema.parse({ items: [product], total: 1, limit: 20, offset: 0 }))
      .toMatchObject({ total: 1, items: [{ risk_level: null }] });
  });

  it('rejects non-decimal monetary values', () => {
    expect(() => productSchema.parse({ ...product, premium_amount: 'NGN 9,500' })).toThrow();
  });

  it('coerces valid filter query values', () => {
    expect(marketplaceFiltersSchema.parse({ min_premium: '0', max_premium: '50000', offset: '20' }))
      .toMatchObject({ min_premium: 0, max_premium: 50000, offset: 20 });
  });
});
