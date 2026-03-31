import { z } from 'zod';
import dotenv from 'dotenv';

// Initial Load
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  SOLANA_RPC_URL: z.string().url().default('https://api.mainnet-beta.solana.com'),
  WALLET_PRIVATE_KEY: z.string().optional(),
  GEYSER_ENDPOINT: z.string().optional(),
  GEYSER_TOKEN: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  AXIOM_TOKEN: z.string().optional(),
  AXIOM_DATASET: z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().default('https://app.posthog.com'),
  JITO_BLOCK_ENGINE_URL: z.string().default('https://mainnet.block-engine.jito.wtf'),
  JITO_TIP_PAYMENT_ADDRESS: z.string().default('Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY'),
  OPENAI_API_KEY: z.string().optional(),
});

/**
 * Institutional Grade Environment Validation
 */
export const env = envSchema.parse(process.env);
