import { parentPort, workerData } from 'worker_threads';
import OpenAI from 'openai';

const STRUCTURED_SCHEMA = `Respond in this exact JSON format:
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
 * Receives ALL L1 enrichment data for deep analysis.
 */
async function run() {
  const { context, apiKey } = workerData;

  if (!apiKey) {
    parentPort?.postMessage({
      verdict: 'WATCH',
      narrative: `[NO AI KEY] Token ${context.symbol} scored ${context.l1Score} on heuristics only.`,
      catalysts: context.positivesSignals || [],
      riskFactors: context.redFlags || [],
      confidence: 'LOW',
      generatedByAI: false,
      entryStrategy: 'SKIP',
    });
    return;
  }

  const openai = new OpenAI({ apiKey });

  const systemPrompt = `Kamu adalah rzuna, AI Oracle on-chain untuk platform rzuna di Solana.
Tugasmu adalah menganalisis token baru dan memberikan L2 reasoning yang tajam, singkat, dan data-driven.
Fokus pada: likuiditas awal, risiko mint authority, distribusi holder, momentum sosial, dan pola narasi.

RULES:
- Kamu adalah FILTER TERAKHIR sebelum user invest. Keamanan user adalah PRIORITAS #1.
- Jika ada RED FLAG serius (MINT_NOT_REVOKED, DEV_DUMP, WHALE_DOMINATED), verdict HARUS "REJECT".
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
      model: 'gpt-4o-mini', // Cost-efficient for high-volume scoring
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300, // Cost control: keep responses tight
      temperature: 0.3, // Low temp for consistent, analytical output
    });

    const content = JSON.parse(response.choices[0].message.content || '{}');
    parentPort?.postMessage({
      verdict: content.verdict || 'WATCH',
      narrative: content.narrative || 'Insufficient data for analysis.',
      catalysts: content.catalysts || [],
      riskFactors: content.riskFactors || [],
      confidence: content.confidence || 'LOW',
      generatedByAI: true,
      entryStrategy: content.entryStrategy || 'SKIP',
      tokensUsed: response.usage?.total_tokens || 0,
    });
  } catch (error: any) {
    parentPort?.postMessage({ error: error.message });
  }
}

void run();
