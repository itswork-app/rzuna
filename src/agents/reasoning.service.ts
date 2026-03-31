import OpenAI from 'openai';
import { env } from '../utils/env.js';
import { rzunaCharacter } from './rzuna.character.js';
import type { MintEvent } from '../infrastructure/solana/geyser.service.js';

export interface L2Reasoning {
  narrative: string;
  catalysts: string[];
  riskFactors: string[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  generatedByAI: boolean;
}

function getCatalysts(event: MintEvent, score: number): string[] {
  const catalysts: string[] = [];
  const liq = event.initialLiquidity ?? 0;
  const social = event.socialScore ?? 0;

  if (liq > 500)
    catalysts.push(`Strong initial liquidity ($${liq.toFixed(0)}) signals serious deployment`);
  if (social > 60) catalysts.push(`Social momentum score ${social} — community traction detected`);
  if (score >= 90)
    catalysts.push(`L1 score ${score} — qualifies as Private Token (Starlight/VIP tier)`);

  return catalysts.length ? catalysts : ['Token lolos filter L1 rzuna'];
}

function getRiskFactors(event: MintEvent, social: number): string[] {
  const riskFactors: string[] = [];
  const liq = event.initialLiquidity ?? 0;

  if (liq < 100) riskFactors.push('Low initial liquidity — potential slow rug vector');
  if (event.metadata?.isMintable)
    riskFactors.push('CRITICAL: Mint authority active — inflation risk');
  if (social < 20) riskFactors.push('Weak social signal — low organic interest');

  return riskFactors.length ? riskFactors : ['Belum ada red flag terdeteksi'];
}

// Template-based fallback (no API key required, <10ms)
function buildTemplateReasoning(event: MintEvent, score: number): L2Reasoning {
  const symbol = event.metadata?.symbol ?? 'UNKNOWN';
  const liq = event.initialLiquidity ?? 0;
  const social = event.socialScore ?? 0;

  const catalysts = getCatalysts(event, score);
  const riskFactors = getRiskFactors(event, social);

  const narrative =
    `$${symbol} dikirim ke pipeline rzuna dengan skor L1 ${score}. ` +
    `Likuiditas awal: $${liq.toFixed(0)}. Momentum sosial: ${social}. ` +
    (score >= 90
      ? 'Token ini masuk kategori PRIVATE — eksklusif untuk tier Starlight+/VIP.'
      : 'Token ini memenuhi standar minimum platform rzuna.');

  return {
    narrative,
    catalysts,
    riskFactors,
    confidence: score >= 90 ? 'HIGH' : score >= 87 ? 'MEDIUM' : 'LOW',
    generatedByAI: false,
  };
}

/**
 * rzuna L2 Reasoning Service
 * Standar: Canonical Master Blueprint v1.3 (PR 5 — Agent Intelligence)
 *
 * Uses OpenAI GPT-4o-mini for AI inference when OPENAI_API_KEY is present.
 * Falls back to template-based reasoning (<10ms) if no key available.
 */
export class ReasoningService {
  private openai: OpenAI | null = null;

  constructor() {
    if (env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    }
  }

  async analyzeToken(event: MintEvent, score: number): Promise<L2Reasoning> {
    if (!this.openai) return buildTemplateReasoning(event, score);

    try {
      const tokenProfile = this.getTokenProfile(event, score);
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          { role: 'system', content: rzunaCharacter.systemPrompt },
          {
            role: 'user',
            content: `Analisis token berikut dan beri L2 reasoning:\n${JSON.stringify(tokenProfile, null, 2)}\n\nRespond ONLY with valid JSON:\n{"narrative": "...", "catalysts": ["..."], "riskFactors": ["..."], "confidence": "HIGH|MEDIUM|LOW"}`,
          },
        ],
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content ?? '{}');
      return {
        narrative: parsed.narrative ?? 'AI generated narrative unavailable',
        catalysts: parsed.catalysts ?? ['Reviewing catalysts...'],
        riskFactors: parsed.riskFactors ?? ['Monitoring risks...'],
        confidence: parsed.confidence ?? 'MEDIUM',
        generatedByAI: true,
      };
    } catch (error) {
      console.error('[ReasoningService] OpenAI error:', error);
      return buildTemplateReasoning(event, score);
    }
  }

  private getTokenProfile(event: MintEvent, score: number) {
    return {
      symbol: event.metadata?.symbol ?? 'UNKNOWN',
      name: event.metadata?.name ?? 'UNKNOWN',
      mint: event.mint,
      initialLiquidity: event.initialLiquidity ?? 0,
      socialScore: event.socialScore ?? 0,
      isMintable: event.metadata?.isMintable ?? false,
      l1Score: score,
    };
  }
}
