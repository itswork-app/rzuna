import { z } from 'zod';
import dotenv from 'dotenv';

// Initial Load
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  GEYSER_ENDPOINT: z.string().optional(),
  GEYSER_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
});

/**
 * Institutional Grade Environment Validation
 */
export const env = envSchema.parse(process.env);
