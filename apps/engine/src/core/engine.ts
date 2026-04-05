import { EventEmitter } from 'events';
import { SolanaAdapter } from '../infrastructure/adapters/solana.adapter.js';
import {
  PumpPortalAdapter,
  type PumpPortalEvent,
} from '../infrastructure/adapters/pumpportal.adapter.js';
import { PumpapiAdapter } from '../infrastructure/adapters/pumpapi.adapter.js';
import { ScoringService } from './services/scoring.service.js';
import { CreatorReputationService } from './services/reputation.service.js';
import { TokenSecurityService } from './services/security.service.js';
import { ElizaBrain } from '../agents/eliza.brain.js';
import { ReasoningService, type ReasoningResult } from '../agents/reasoning.service.js';
import { TreasuryWorker } from '../agents/workers/treasury.worker.js';
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
  private recentTraders: Map<string, string[]> = new Map();
  private tradeTimestamps: Map<string, number[]> = new Map(); // mint -> timestamps
  private reputations = new CreatorReputationService(); // changed to avoid shadowing but wait, 'reputation' was used everywhere. Let's keep private reputation.
  private reputation = new CreatorReputationService();
  private security = new TokenSecurityService();
  public eliza = new ElizaBrain();
  private treasuryWorker = new TreasuryWorker();

  // 🏛️ Legacy Bridge for Audit Hooks (V22.1)
  public readonly hooks = {
    logAudit: async (data: any) => {
      console.info('🛡️ [Engine:Bridge] Audit Log:', data.type, data.score);
    },
  };

  async start() {
    console.info('🛡️ [Engine] Starting Dual-Path Orchestrator V22.1...');

    // 💧 Hydrate memory from Upstash/Redis on boot
    await this.reputation.hydrateFromRedis();

    this.pumpPortal.on('transaction', (event: PumpPortalEvent) => this.handleStream(event));
    this.solana.on('mint', (event) => this.handleStream(event));

    // Brain/Social Sidecar Wiring
    this.on('signal', (signal: AlphaSignal) => {
      // Pass signal to Eliza for background broadcasting
      void this.eliza.processSignal(signal);
    });

    this.eliza.on('broadcast', (message) => {
      // In production, this pushes to Telegram/Twitter
      console.info(`\n📢 [ElizaOS: ${message.platform}] ${message.content}\n`);
    });

    // 🧹 Start Treasury Sweeper Module
    this.treasuryWorker.start();

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

      if (initialScore.score >= this.scorer.L1_THRESHOLD) {
        const metadata = await this.pumpapi.getTokenMetadata(event.mint);
        const creatorWallet = metadata?.creator || event.traderPublicKey;

        // Creator Reputation (O(1) lookup)
        const rep = this.reputation.getScoreModifier(creatorWallet);

        // Stateful Wash Tracker
        const traders = this.recentTraders.get(event.mint) || [];
        const isRepetitive = traders.includes(event.traderPublicKey);

        // Volume Velocity (trades per minute)
        const now = Date.now();
        const timestamps = this.tradeTimestamps.get(event.mint) || [];
        timestamps.push(now);
        const oneMinAgo = now - 60_000;
        const recentTimestamps = timestamps.filter((t) => t > oneMinAgo);
        this.tradeTimestamps.set(event.mint, recentTimestamps);
        const tradesPerMinute = recentTimestamps.length;

        // On-chain security check (cached, non-blocking)
        const securityReport = await this.security.getSecurityReport(event.mint);

        // Re-score with ALL enrichment data
        const enrichedScore = this.scorer.calculateInitialScore({
          ...event,
          ...metadata,
          devPublicKey: creatorWallet,
          isRepetitive,
          _reputationModifier: rep.modifier,
          _reputationFlag: rep.redFlag,
          _tradesPerMinute: tradesPerMinute,
          _securityScore: securityReport?.score,
          _securityFlags: securityReport?.redFlags,
        });

        // Update tracking
        traders.push(event.traderPublicKey);
        if (traders.length > 20) traders.shift();
        this.recentTraders.set(event.mint, traders);

        // Record behavior for reputation
        if (event.txType === 'create') this.reputation.recordCreation(creatorWallet);
        if (enrichedScore.redFlags.includes('DEV_DUMP'))
          this.reputation.recordRugpull(creatorWallet);
        if (enrichedScore.redFlags.includes('SELF_BUY'))
          this.reputation.recordWashTrade(creatorWallet);

        if (enrichedScore.score < this.scorer.L1_THRESHOLD) return;

        // L2 AI Reasoning with full context
        let aiResult: ReasoningResult;
        try {
          aiResult = await this.reasoning.analyzeToken({
            mint: event.mint,
            symbol: event.symbol || metadata?.symbol || 'UNKNOWN',
            name: event.name || metadata?.name || 'UNKNOWN',
            txType: event.txType,
            traderPublicKey: event.traderPublicKey,
            l1Score: enrichedScore.score,
            vSol: event.vSolInBondingCurve || 0,
            mcapSol: event.marketCapSol || 0,
            twitter: metadata?.twitter,
            website: metadata?.website,
            telegram: metadata?.telegram,
            mintRevoked: securityReport?.mintAuthorityRevoked,
            freezeRevoked: securityReport?.freezeAuthorityRevoked,
            topHolderPct: securityReport?.topHolderPct,
            holderCount: securityReport?.holderCount,
            creatorReputation: rep.reputation,
            redFlags: enrichedScore.redFlags,
            tradesPerMinute,
          });
        } catch {
          aiResult = {
            verdict: 'WATCH',
            narrative: '[L2 Unavailable] Signal passed L1 heuristic filter only.',
            confidence: 'LOW',
            riskFactors: enrichedScore.redFlags,
            catalysts: [],
            generatedByAI: false,
          };
        }

        // Confidence gate: AI says REJECT → do NOT emit signal
        if (aiResult.verdict === 'REJECT') return;

        await this.persistEnrichedToken(event, enrichedScore, aiResult.narrative, metadata);

        const signal: AlphaSignal = {
          mint: event.mint,
          symbol: event.symbol || metadata?.symbol || 'UNKNOWN',
          name: event.name || metadata?.name || 'UNKNOWN',
          description: metadata?.description,
          twitter: metadata?.twitter || null,
          telegram: metadata?.telegram || null,
          website: metadata?.website || null,
          score: enrichedScore.score,
          isPremium: enrichedScore.isPremium,
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
        twitter: metadata?.twitter || null,
        telegram: metadata?.telegram || null,
        website: metadata?.website || null,
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
    this.treasuryWorker.stop();
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
