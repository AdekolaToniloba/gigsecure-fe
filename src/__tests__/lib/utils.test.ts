import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn()', () => {
  it('merges class names together', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes (truthy)', () => {
    expect(cn('base', true && 'active')).toBe('base active');
  });

  it('ignores falsy conditional classes', () => {
    expect(cn('base', false && 'hidden')).toBe('base');
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('resolves Tailwind padding conflicts — last wins', () => {
    // tailwind-merge should keep only p-4
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('resolves Tailwind text-color conflicts — last wins', () => {
    expect(cn('text-red-500', 'text-blue-600')).toBe('text-blue-600');
  });

  it('returns an empty string when no arguments are provided', () => {
    expect(cn()).toBe('');
  });

  it('handles an array of class names', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });
});
