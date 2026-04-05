import { z } from 'zod';

export const AlphaReasoningSchema = z.object({
  verdict: z.enum(['ALPHA', 'WATCH', 'REJECT']).optional(),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  narrative: z.string(),
  riskFactors: z.array(z.string()),
  catalysts: z.array(z.string()),
  entryStrategy: z.string().optional(),
});

export const AlphaSignalSchema = z.object({
  mint: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  description: z.string().optional(),

  // Socials
  twitter: z.string().nullable().optional(),
  telegram: z.string().nullable().optional(),
  website: z.string().nullable().optional(),

  score: z.number(),
  isPremium: z.boolean(),
  isNew: z.boolean(),
  timestamp: z.number(),
  reasoning: AlphaReasoningSchema.optional(),
  aiReasoning: AlphaReasoningSchema.extend({
    generatedByAI: z.boolean(),
  }).optional(),

  // 🌉 Legacy Bridge Properties
  event: z.any().optional(),
  latency: z.number().optional(),
});
export type AlphaSignal = z.infer<typeof AlphaSignalSchema>;

export const TokenSignalSchema = z.object({
  id: z.string(),
  score: z.number(),
  aiReasoning: z
    .object({
      narrative: z.string(),
      confident: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    })
    .optional(),
  event: z.object({
    mint: z.string(),
    signature: z.string(),
    timestamp: z.string(),
    initialLiquidity: z.number(),
    socialScore: z.number(),
    metadata: z
      .object({
        name: z.string(),
        symbol: z.string(),
        description: z.string().optional(),
        twitter: z.string().nullable().optional(),
        telegram: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
      })
      .optional(),
  }),
});
export type TokenSignal = z.infer<typeof TokenSignalSchema>;
