import { describe, it, expect } from 'vitest';
import { emailSchema, paginationSchema } from '@/lib/validators';

describe('emailSchema', () => {
  it('accepts a valid email', () => {
    expect(() => emailSchema.parse('user@example.com')).not.toThrow();
  });

  it('rejects an email without @', () => {
    expect(() => emailSchema.parse('notanemail')).toThrow();
  });

  it('rejects an email without a domain', () => {
    expect(() => emailSchema.parse('user@')).toThrow();
  });

  it('rejects an empty string', () => {
    expect(() => emailSchema.parse('')).toThrow();
  });

  it('returns the email string on success', () => {
    expect(emailSchema.parse('hello@world.io')).toBe('hello@world.io');
  });
});

describe('paginationSchema', () => {
  it('applies default page=1 and limit=10 when values are missing', () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('accepts valid page and limit values', () => {
    const result = paginationSchema.parse({ page: 3, limit: 25 });
    expect(result.page).toBe(3);
    expect(result.limit).toBe(25);
  });

  it('rejects a page less than 1', () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it('rejects a limit greater than 100', () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });

  it('rejects a float page value', () => {
    expect(() => paginationSchema.parse({ page: 1.5 })).toThrow();
  });
});
