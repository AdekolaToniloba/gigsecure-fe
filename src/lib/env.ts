import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1, 'NEXT_PUBLIC_API_BASE_URL is required'),
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL is required'),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  STAGING_PASSWORD: z.string().optional(),
});

const _parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  STAGING_PASSWORD: process.env.STAGING_PASSWORD,
});

if (!_parsed.success) {
  const issues = _parsed.error.issues
    .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(
    `\n❌ Missing required environment variables:\n${issues}\n\nAdd them to your .env.local file.`
  );
}

export const env = _parsed.data;
