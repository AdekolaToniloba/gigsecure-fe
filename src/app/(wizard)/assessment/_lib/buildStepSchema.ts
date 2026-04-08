import { z } from 'zod';
import type { Question } from '@/types/risk-assessment';

/**
 * Builds a Zod object schema from an array of questions.
 * Used by each step component to validate its RHF form.
 */
export function buildStepSchema(questions: Question[]): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const question of questions) {
    switch (question.type) {
      case 'single_choice':
        shape[question.id] = z.string().min(1, 'Please select an option');
        break;

      case 'boolean':
        // Stored as string 'true' or 'false' from radio cards
        shape[question.id] = z.enum(['true', 'false'], {
          error: 'Please answer this question',
        });
        break;

      case 'multi_choice':
        shape[question.id] = z
          .array(z.string())
          .min(1, 'Select at least one option');
        break;

      case 'ranking':
        shape[question.id] = z
          .array(z.string())
          .min(1, 'Please rank at least one option')
          .max(question.max_selections, `Select up to ${question.max_selections} options`);
        break;

      case 'rating':
        shape[question.id] = z
          .number({ error: 'Please rate this' })
          .min(question.min)
          .max(question.max);
        break;
    }
  }

  return z.object(shape);
}
