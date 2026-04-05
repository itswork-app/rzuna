import { parentPort, workerData } from 'worker_threads';
import OpenAI from 'openai';
import { z } from 'zod';

/**
 * 🏛️ Zod Schema: AI Response Validation (Polisi — Blueprint V22.1)
 * Ensures AI output is ALWAYS structurally valid before reaching users.
 */
const AIResponseSchema = z.object({
  verdict: z.enum(['ALPHA', 'WATCH', 'REJECT']),
  confidence: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  narrative: z.string().min(10).max(500),
  catalysts: z.array(z.string()).max(3).default([]),
  riskFactors: z.array(z.string()).max(3).default([]),
  entryStrategy: z.string().default('SKIP'),
});

type AIResponse = z.infer<typeof AIResponseSchema>;

const STRUCTURED_SCHEMA = `Respond ONLY in this exact JSON format:
{
  "verdict": "ALPHA" | "WATCH" | "REJECT",
  "confidence": "HIGH" | "MEDIUM" | "LOW",
  "narrative": "2-3 sentence analysis in mixed Indo-English trading slang",
  "catalysts": ["max 3 bullish factors"],
  "riskFactors": ["max 3 risk factors"],
  "entryStrategy": "specific entry suggestion or 'SKIP'"
}`;

/**
 * 🏛️ Reasoning Worker V2: Full-Context AI Sensor
 * Standard: Canonical Master Blueprint V22.1
 * - Zod-validated output (Polisi)
 * - Safety-first system prompt (rzuna character)
 * - Cost-efficient model (gpt-4o-mini)
 */
async function run() {
  const { context, apiKey, baseUrl } = workerData;

  // No API key → template response (no AI)
  if (!apiKey) {
    parentPort?.postMessage({
      verdict: 'WATCH',
      narrative: `[NO AI KEY] Token ${context.symbol} scored ${context.l1Score} on heuristics only.`,
      catalysts: [],
      riskFactors: context.redFlags || [],
      confidence: 'LOW',
      generatedByAI: false,
      entryStrategy: 'SKIP',
    });
    return;
  }

  // OpenRouter (Blueprint V22.1) or direct OpenAI
  const openai = new OpenAI({
    apiKey,
    ...(baseUrl ? { baseURL: baseUrl } : {}),
  });

  const systemPrompt = `Kamu adalah rzuna, AI Oracle on-chain untuk platform rzuna di Solana.
Tugasmu adalah menganalisis token baru dan memberikan L2 reasoning yang tajam, singkat, dan data-driven.
Fokus pada: likuiditas awal, risiko mint authority, distribusi holder, momentum sosial, dan pola narasi.

RULES:
- Kamu adalah FILTER TERAKHIR sebelum user invest. Keamanan user adalah PRIORITAS #1.
- Jika ada RED FLAG serius (MINT_NOT_REVOKED, DEV_DUMP, WHALE_DOMINATED, CREATOR_BLACKLISTED), verdict HARUS "REJECT".
- Hanya beri "ALPHA" jika confidence HIGH dan tidak ada red flag kritis.
- "WATCH" untuk token menarik tapi belum terbukti aman.
- Bahasa: campuran Indonesia dan English trading slang. Singkat, 2-3 kalimat.

${STRUCTURED_SCHEMA}`;

  const userPrompt = `Analyze this Solana token:

TOKEN: ${context.symbol} (${context.name})
MINT: ${context.mint}
L1 SCORE: ${context.l1Score}/100

LIQUIDITY:
- vSol in Bonding Curve: ${context.vSol} SOL
- Market Cap: ${context.mcapSol} SOL

SOCIAL PRESENCE:
- Twitter: ${context.twitter || 'NONE'}
- Website: ${context.website || 'NONE'}
- Telegram: ${context.telegram || 'NONE'}

ON-CHAIN SECURITY:
- Mint Authority Revoked: ${context.mintRevoked ?? 'UNKNOWN'}
- Freeze Authority Revoked: ${context.freezeRevoked ?? 'UNKNOWN'}
- Top Holder %: ${context.topHolderPct ?? 'UNKNOWN'}%
- Holder Count: ${context.holderCount ?? 'UNKNOWN'}

CREATOR REPUTATION: ${context.creatorReputation || 'UNKNOWN'}
RED FLAGS FROM L1: ${context.redFlags?.length ? context.redFlags.join(', ') : 'NONE'}
TRADE VELOCITY: ${context.tradesPerMinute ?? 0} trades/min

Transaction: ${context.txType} by ${context.traderPublicKey?.slice(0, 8) || 'unknown'}...`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.3,
    });

    const raw = JSON.parse(response.choices[0].message.content || '{}');

    // 🛡️ Zod Validation (Polisi — Blueprint V22.1)
    const parsed = AIResponseSchema.safeParse(raw);

    if (parsed.success) {
      parentPort?.postMessage({
        ...parsed.data,
        generatedByAI: true,
        tokensUsed: response.usage?.total_tokens || 0,
      });
    } else {
      // AI returned garbage → safe fallback
      console.error('[Reasoning Worker] Zod validation failed:', parsed.error.issues);
      parentPort?.postMessage({
        verdict: 'WATCH',
        narrative: `[INVALID AI OUTPUT] Falling back to L1. Zod errors: ${parsed.error.issues.map((i) => i.message).join(', ')}`,
        catalysts: [],
        riskFactors: context.redFlags || [],
        confidence: 'LOW',
        generatedByAI: false,
        entryStrategy: 'SKIP',
      });
    }
  } catch (error: any) {
    parentPort?.postMessage({ error: error.message });
  }
}

void run();
