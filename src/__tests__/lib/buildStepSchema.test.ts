import { describe, it, expect } from 'vitest';
import { buildStepSchema } from '@/app/(wizard)/assessment/_lib/buildStepSchema';
import type { Question } from '@/types/risk-assessment';

describe('buildStepSchema', () => {
  it('single_choice: rejects empty string', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Pick one', type: 'single_choice', options: ['A', 'B'] },
    ];
    const schema = buildStepSchema(questions);
    const result = schema.safeParse({ q1: '' });
    expect(result.success).toBe(false);
  });

  it('single_choice: accepts non-empty string', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Pick one', type: 'single_choice', options: ['A', 'B'] },
    ];
    const schema = buildStepSchema(questions);
    const result = schema.safeParse({ q1: 'A' });
    expect(result.success).toBe(true);
  });

  it('boolean: accepts "true" and "false"', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Yes or no?', type: 'boolean' },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: 'true' }).success).toBe(true);
    expect(schema.safeParse({ q1: 'false' }).success).toBe(true);
  });

  it('boolean: rejects other strings', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Yes or no?', type: 'boolean' },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: 'maybe' }).success).toBe(false);
    expect(schema.safeParse({ q1: '' }).success).toBe(false);
  });

  it('multi_choice: rejects empty array', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Select many', type: 'multi_choice', options: ['A', 'B', 'C'] },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: [] }).success).toBe(false);
  });

  it('multi_choice: accepts non-empty array', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Select many', type: 'multi_choice', options: ['A', 'B', 'C'] },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: ['A', 'B'] }).success).toBe(true);
  });

  it('ranking: rejects array exceeding max_selections', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Rank top 3', type: 'ranking', max_selections: 3, options: ['A', 'B', 'C', 'D'] },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: ['A', 'B', 'C', 'D'] }).success).toBe(false);
  });

  it('ranking: accepts array within max_selections', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Rank top 3', type: 'ranking', max_selections: 3, options: ['A', 'B', 'C', 'D'] },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: ['A', 'B'] }).success).toBe(true);
    expect(schema.safeParse({ q1: ['A', 'B', 'C'] }).success).toBe(true);
  });

  it('rating: rejects values outside min/max range', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Rate 1-5', type: 'rating', min: 1, max: 5, labels: {} },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: 0 }).success).toBe(false);
    expect(schema.safeParse({ q1: 6 }).success).toBe(false);
  });

  it('rating: accepts values within range', () => {
    const questions: Question[] = [
      { id: 'q1', text: 'Rate 1-5', type: 'rating', min: 1, max: 5, labels: {} },
    ];
    const schema = buildStepSchema(questions);
    expect(schema.safeParse({ q1: 1 }).success).toBe(true);
    expect(schema.safeParse({ q1: 3 }).success).toBe(true);
    expect(schema.safeParse({ q1: 5 }).success).toBe(true);
  });

  it('mixed question types: combined schema validates correctly', () => {
    const questions: Question[] = [
      { id: 'sc', text: 'Pick one', type: 'single_choice', options: ['X'] },
      { id: 'bool', text: 'Yes/No', type: 'boolean' },
      { id: 'mc', text: 'Multi', type: 'multi_choice', options: ['A'] },
    ];
    const schema = buildStepSchema(questions);

    // Valid
    expect(schema.safeParse({ sc: 'X', bool: 'true', mc: ['A'] }).success).toBe(true);
    // Invalid — missing multi_choice
    expect(schema.safeParse({ sc: 'X', bool: 'true', mc: [] }).success).toBe(false);
  });
});
