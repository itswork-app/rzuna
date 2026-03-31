import { GeyserService, type MintEvent } from '../infrastructure/solana/geyser.service.js';
import { ScoringService, type ScoringResult } from './scoring/scoring.service.js';
import { UserRank } from './types/user.js';
import { supabase } from '../infrastructure/supabase/client.js';
import { ReasoningService, type L2Reasoning } from '../agents/reasoning.service.js';
import { RealtimeService } from '../infrastructure/supabase/realtime.service.js';

export interface AlphaSignal {
  event: MintEvent;
  score: number;
  reasoning?: string[];
  latency: number;
  isPremium: boolean;
  aiReasoning?: L2Reasoning;
}

export interface EngineHooks {
  logAudit?: (data: {
    type: string;
    score: number;
    reasoning: string;
    latency: number;
    mint: string;
  }) => void;
}

/**
 * RZUNA Intelligence Engine (PR 3: The Sensor Orchestrator)
 */
export class IntelligenceEngine {
  private geyser: GeyserService;
  private scorer: ScoringService;
  private hooks: EngineHooks;
  private activeSignals: Map<string, AlphaSignal> = new Map();
  private autoDownInterval?: NodeJS.Timeout;
  private reasoning: ReasoningService;
  private realtime: RealtimeService;

  constructor(hooks?: EngineHooks) {
    this.hooks = hooks || {};
    this.scorer = new ScoringService();
    this.geyser = new GeyserService();
    this.reasoning = new ReasoningService();
    this.realtime = new RealtimeService();
  }

  async start() {
    this.setupPipeline();
    this.startAutoDownExecution();
    await this.geyser.start();
  }

  private setupPipeline() {
    // 1. GEYSER INGESTION: Receive event from GeyserService
    this.geyser.on('mint', (event: MintEvent) => {
      const startTime = performance.now();

      // 2. SCORING INTEGRATION: Send to calculateScore
      const result: ScoringResult = this.scorer.calculateScore(event);
      const latency = performance.now() - startTime;

      if (result.score >= 85) {
        const signal: AlphaSignal = {
          event,
          score: result.score,
          latency,
          isPremium: result.score >= 90,
          reasoning: result.reasoning,
        };
        this.activeSignals.set(event.mint, signal);

        // 3. L2 REASONING: Async AI Analysis (Agent Intelligence)
        void (async () => {
          const l2Result = await this.reasoning.analyzeToken(event, result.score);
          signal.aiReasoning = l2Result;

          // 4. PERSISTENCE: Upsert to Supabase with AI Reasoning
          await this.persistToSupabase(signal);

          // 5. VIP BROADCAST: Realtime delivery for 90+ scores
          if (signal.isPremium) {
            this.realtime.broadcastVipAlpha(signal, l2Result);
          }

          // 6. AUDIT TRAIL: Dispatch telemetry to Axiom
          if (this.hooks.logAudit) {
            this.hooks.logAudit({
              type: 'ALPHA_L2_COMPLETE',
              mint: event.mint,
              score: result.score,
              reasoning: l2Result.narrative,
              latency: performance.now() - startTime,
            });
          }
        })();
      }
    });

    // 1b. GEYSER ERROR HANDLING: Handle stream failures gracefully
    this.geyser.on('error', (error: Error) => {
      console.error('[IntelligenceEngine] Geyser stream error:', error);
      // In a real institutional setup, we might trigger a circuit breaker or alert here.
    });
  }

  private async persistToSupabase(signal: AlphaSignal) {
    const data = this.preparePersistData(signal);
    const response = await supabase
      .from('scouted_tokens')
      .upsert(data, { onConflict: 'mint_address' });

    if (!response || response.error) {
      console.error('[Engine] Failed to persist token:', response?.error || 'No response');
    }
  }

  private preparePersistData(signal: AlphaSignal) {
    const { event, score, reasoning, isPremium } = signal;
    return {
      mint_address: event.mint,
      symbol: event.metadata?.symbol ?? 'UNKNOWN',
      base_score: score,
      ai_reasoning: signal.aiReasoning?.narrative ?? reasoning?.join('\n') ?? '',
      is_active: true,
      is_private: isPremium,
      metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : null,
    } as unknown as never;
  }

  private startAutoDownExecution() {
    this.autoDownInterval = setInterval(() => {
      for (const [mint, signal] of this.activeSignals.entries()) {
        const currentResult: ScoringResult = this.scorer.calculateScore(signal.event);

        if (this.scorer.shouldDelist(currentResult.score)) {
          this.activeSignals.delete(mint);
          console.warn(
            `[AUTO-DOWN] Mint ${mint} score dropped to ${currentResult.score}. Delisted.`,
          );

          void (async () => {
            const response = await supabase
              .from('scouted_tokens')
              .update({ is_active: false } as unknown as never)
              .eq('mint_address', mint);

            if (!response || response.error) {
              console.error(
                '[Engine] Failed to Auto-Down token:',
                response?.error || 'No response',
              );
            }
          })();
        }
      }
    }, 10000);
  }

  stop() {
    this.geyser.removeAllListeners();
    if (this.autoDownInterval) clearInterval(this.autoDownInterval);
  }

  getTieredSignals(
    rank: UserRank,
    isStarlight: boolean,
    isVIP: boolean,
    profile: { aiQuotaLimit: number; aiQuotaUsed: number },
  ): AlphaSignal[] {
    try {
      if (!this.activeSignals) return [];

      const access = {
        hasPrivateTokenAccess: isStarlight || isVIP,
        hasAiReasoning: isStarlight || isVIP,
        aiReasoningQuota: profile.aiQuotaLimit - profile.aiQuotaUsed,
        priorityLevel: isVIP ? 10 : isStarlight ? 5 : 1,
      };

      const signals = Array.from(this.activeSignals.values())
        .filter((s) => {
          if (s.isPremium && !access.hasPrivateTokenAccess) {
            const prob = rank === UserRank.ELITE ? 0.5 : rank === UserRank.PRO ? 0.3 : 0.1;
            return Math.random() < prob;
          }
          return true;
        })
        .map((s) => ({
          ...s,
          aiReasoning:
            access.hasAiReasoning && access.aiReasoningQuota > 0
              ? s.aiReasoning
              : isVIP
                ? s.aiReasoning
                : s.aiReasoning
                  ? {
                      ...s.aiReasoning,
                      narrative: '[HIDDEN] Upgrade to VIP or check quota per Eliza OS reasoning',
                    }
                  : undefined,
        }));

      return signals.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('[ENGINE] Failed to get tiered signals:', error);
      return [];
    }
  }
}
