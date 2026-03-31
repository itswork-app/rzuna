import { GeyserService, type MintEvent } from '../infrastructure/solana/geyser.service.js';
import { ScoringService, type ScoringResult } from './scoring/scoring.service.js';
import { UserRank } from './types/user.js';
import { supabase } from '../infrastructure/supabase/client.js';

export interface AlphaSignal {
  event: MintEvent;
  score: number;
  reasoning?: string[];
  latency: number;
  isPremium: boolean;
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

  constructor(hooks?: EngineHooks) {
    this.hooks = hooks || {};
    this.scorer = new ScoringService();
    this.geyser = new GeyserService(); // No longer takes a scorer!
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

        // 3. PERSISTENCE: Upsert to Supabase
        void this.persistToSupabase(signal);

        // 5. AUDIT TRAIL: Dispatch telemetry to Axiom
        if (this.hooks.logAudit) {
          this.hooks.logAudit({
            type: 'ALPHA_DETECTED',
            mint: event.mint,
            score: result.score,
            reasoning: result.reasoning.join(' | '),
            latency,
          });
        }
      }
    });
  }

  private async persistToSupabase(signal: AlphaSignal) {
    const { event, score, reasoning, isPremium } = signal;
    const { error } = await supabase.from('scouted_tokens').upsert(
      {
        mint_address: event.mint,
        symbol: event.metadata?.symbol ?? 'UNKNOWN',
        base_score: score,
        ai_reasoning: reasoning ? reasoning.join('\n') : '',
        is_active: true,
        is_private: isPremium,
        metadata: event.metadata ? JSON.parse(JSON.stringify(event.metadata)) : null,
      } as unknown as never,
      { onConflict: 'mint_address' },
    );

    if (error) console.error('[Engine] Failed to persist token:', error);
  }

  private startAutoDownExecution() {
    this.autoDownInterval = setInterval(() => {
      for (const [mint, signal] of this.activeSignals.entries()) {
        const currentResult: ScoringResult = this.scorer.calculateScore(signal.event);

        // Randomly simulate score decay for demonstration
        const finalScore = Math.random() > 0.95 ? 80 : currentResult.score;

        // 4. AUTO-DOWN EXECUTION
        if (this.scorer.shouldDelist(finalScore)) {
          this.activeSignals.delete(mint);
          console.warn(`[AUTO-DOWN] Mint ${mint} score dropped to ${finalScore}.`);

          void (async () => {
            const { error } = await supabase
              .from('scouted_tokens')
              .update({ is_active: false } as unknown as never)
              .eq('mint_address', mint);

            if (error) console.error('[Engine] Failed to Auto-Down token:', error);
          })();
        }
      }
    }, 10000);
  }

  stop() {
    this.geyser.removeAllListeners();
    if (this.autoDownInterval) clearInterval(this.autoDownInterval);
  }

  getTieredSignals(rank: UserRank, isStarlight: boolean, isVIP: boolean): AlphaSignal[] {
    return Array.from(this.activeSignals.values())
      .filter((signal) => {
        if (signal.score < 85) return false;
        if (signal.isPremium) {
          if (isStarlight || rank === UserRank.ELITE) return true;
          const prob = Math.random();
          if (rank === UserRank.PRO) return prob > 0.5;
          return Math.random() > 0.9;
        }
        return true;
      })
      .map((signal) => {
        // Obfuscate reasoning if not VIP
        if (!isVIP) return { ...signal, reasoning: undefined };
        return signal;
      });
  }
}
