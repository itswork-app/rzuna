import { EventEmitter } from 'events';
import { SolanaAdapter } from '../infrastructure/adapters/solana.adapter.js';
import {
  PumpPortalAdapter,
  type PumpPortalEvent,
} from '../infrastructure/adapters/pumpportal.adapter.js';
import { PumpapiAdapter } from '../infrastructure/adapters/pumpapi.adapter.js';
import { ScoringService } from './services/scoring.service.js';
import { ReasoningService, type ReasoningResult } from '../agents/reasoning.service.js';
import { db, scoutedTokens } from '@rzuna/database';
import { UserRank, type AlphaSignal } from '@rzuna/contracts';

// 🏛️ V22.1 COMPATIBILITY TYPES
export type L1Reasoning = { score: number; reasoning: string[] };
export type L2Reasoning = ReasoningResult;

// Exporting AlphaSignal from contracts for monorepo consistency
export { AlphaSignal };

/**
 * 🏛️ IntelligenceEngine: Dual-Path Sensor Orchestrator
 * Standar: Canonical Master Blueprint v22.1 (Singularity)
 */
export class IntelligenceEngine extends EventEmitter {
  public solana = new SolanaAdapter();
  private pumpPortal = new PumpPortalAdapter();
  private pumpapi = new PumpapiAdapter();
  private scorer = new ScoringService();
  private reasoning = new ReasoningService();
  private activeSignals: Map<string, AlphaSignal> = new Map();

  // 🏛️ Legacy Bridge for Audit Hooks (V22.1)
  public readonly hooks = {
    logAudit: async (data: any) => {
      console.info('🛡️ [Engine:Bridge] Audit Log:', data.type, data.score);
    },
  };

  async start() {
    console.info('🛡️ [Engine] Starting Dual-Path Orchestrator V22.1...');

    this.pumpPortal.on('transaction', (event: PumpPortalEvent) => this.handleStream(event));
    this.solana.on('mint', (event) => this.handleStream(event));

    await Promise.all([this.solana.start(), this.pumpPortal.start()]);
  }

  /**
   * 🏗️ Alpha Event Ingestion Bridge (Back-test & Live)
   */
  async handleAlphaEvent(event: PumpPortalEvent) {
    return this.handleStream(event);
  }

  private async handleStream(event: PumpPortalEvent) {
    const startTime = performance.now();
    try {
      const initialScore = this.scorer.calculateInitialScore(event);

      if (initialScore.score >= 88) {
        const aiResult = await this.reasoning.analyzeToken(event as any, initialScore.score);
        const metadata = await this.pumpapi.getTokenMetadata(event.mint);

        await this.persistEnrichedToken(event, initialScore, aiResult.narrative, metadata);

        const signal: AlphaSignal = {
          mint: event.mint,
          symbol: event.symbol || metadata?.symbol || 'UNKNOWN',
          name: event.name || metadata?.name || 'UNKNOWN',
          description: metadata?.description,
          twitter: metadata?.twitter,
          telegram: metadata?.telegram,
          website: metadata?.website,
          score: initialScore.score,
          isPremium: initialScore.isPremium,
          isNew: true,
          timestamp: Date.now(),
          aiReasoning: {
            ...aiResult,
            riskFactors: aiResult.riskFactors || [],
            catalysts: aiResult.catalysts || [],
          },
          // Legacy bridge properties (hidden in types but passed for safety)
          ...({ event, latency: performance.now() - startTime } as any),
        };
        this.activeSignals.set(event.mint, signal);
        this.emit('signal', signal);
      }
    } catch (err) {
      console.error('❌ [Engine] Stream processing failed:', err);
    }
  }

  private async persistEnrichedToken(
    event: PumpPortalEvent,
    score: any,
    reasoning: string,
    metadata: any,
  ) {
    await db
      .insert(scoutedTokens)
      .values({
        mintAddress: event.mint,
        symbol: event.symbol || metadata?.symbol || 'UNKNOWN',
        name: event.name || metadata?.name || 'UNKNOWN',
        description: metadata?.description,
        twitter: metadata?.twitter,
        telegram: metadata?.telegram,
        website: metadata?.website,
        baseScore: Math.floor(score.score),
        aiReasoning: reasoning,
        isPrivate: score.isPremium,
        isActive: true,
        metadata: { ...event, ...metadata },
      })
      .onConflictDoUpdate({
        target: scoutedTokens.mintAddress,
        set: {
          baseScore: Math.floor(score.score),
          aiReasoning: reasoning,
          twitter: metadata?.twitter,
          telegram: metadata?.telegram,
          website: metadata?.website,
          updatedAt: new Date(),
        },
      });
  }

  // 🏛️ V22.1 Lifecycle Control
  stop() {
    console.info('🛡️ [Engine] Stopping Orchestrator...');
    void this.solana.stop();
    void this.pumpPortal.stop();
    this.removeAllListeners();
  }

  // 🏛️ Backward Compatibility Methods (V22.1 Bridge)
  async ensureVipGeyser() {
    console.info('🛡️ [Engine] VIP Geyser active via SolanaAdapter (Auto-mode).');
  }

  getTieredSignals(
    rank: UserRank = UserRank.BRONZE,
    isStarlight: boolean = false,
    isVIP: boolean = false,
    profile: any = {},
  ): AlphaSignal[] {
    try {
      const signals = Array.from(this.activeSignals.values())
        .map((s) => {
          const signal = { ...s };
          const hasAccess = isVIP || isStarlight || profile?.aiQuotaLimit > profile?.aiQuotaUsed;

          if (!hasAccess && signal.aiReasoning) {
            signal.aiReasoning = {
              ...signal.aiReasoning,
              narrative: '[HIDDEN] Upgrade to VIP or check quota per AIVO OS reasoning',
            };
          }
          return signal;
        })
        .filter((s) => {
          if (!s.isPremium) return true;
          if (isVIP || isStarlight) return true;

          // Probability-based access for High-Rank but Free users
          const prob = rank === UserRank.MYTHIC ? 0.7 : rank === UserRank.DIAMOND ? 0.5 : 0.1;
          return Math.random() < prob;
        });

      return signals.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('🛡️ [ENGINE] Failed to compile tiered signals:', error);
      return [];
    }
  }
}
