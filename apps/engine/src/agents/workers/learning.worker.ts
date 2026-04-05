import { db, scoutedTokens, sql } from '@rzuna/database';
import { TuningService, ScoringConfig } from '../../core/services/tuning.service.js';

interface BatchToken {
  mint: string;
  symbol: string | null;
  baseScore: number | null;
  createdAt: Date;
  isActive: boolean;
}

/**
 * 🏛️ LearningWorker: Batch Strategy Optimizer (V22.2)
 * Implementation: 4-Hour / 150-Token Institutional Cut-off
 * Standar: Canonical Master Blueprint V22.2 (Self-Learning)
 */
export class LearningWorker {
  private tuner: TuningService;
  private interval: NodeJS.Timeout | null = null;
  private lastCutoff = Date.now();

  // Settings per Institutional Blueprint
  private static readonly BATCH_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 Hours
  private static readonly BATCH_SIZE_LIMIT = 150;

  constructor(tuner: TuningService) {
    this.tuner = tuner;
  }

  start() {
    console.info('🧠 [LearningWorker] Initializing 4-Hour Strategy Batcher...');
    // Run an immediate check on boot, then every 1 hour to check cut-off
    this.interval = setInterval(() => void this.checkCutoff(), 60 * 60 * 1000);
    void this.checkCutoff();
  }

  async checkCutoff() {
    const now = Date.now();
    if (now - this.lastCutoff >= LearningWorker.BATCH_WINDOW_MS) {
      console.info('🏛️ [LearningWorker] Batch Cut-off reached. Starting Periodic Optimization...');
      await this.performBatchLearning();
      this.lastCutoff = now;
    }
  }

  /**
   * 🔬 Batch Learning Loop
   * Fetches latest tokens, analyzes performance, and generates tuning recommendations.
   */
  async performBatchLearning() {
    try {
      const config = this.tuner.getConfig();

      // 1. Fetch Batch Data (Limit 150 tokens as per requirement)
      const rawBatch = await db
        .select()
        .from(scoutedTokens)
        .orderBy(sql`${scoutedTokens.createdAt} DESC`)
        .limit(LearningWorker.BATCH_SIZE_LIMIT);

      if (rawBatch.length === 0) {
        console.warn('⚠️ [LearningWorker] No data found for batch optimize.');
        return;
      }

      // 2. Format Context for AI Analysis (Strictly Typed)
      const batchContext: BatchToken[] = rawBatch.map((t: typeof scoutedTokens.$inferSelect) => ({
        mint: t.mintAddress,
        symbol: t.symbol,
        baseScore: t.baseScore,
        createdAt: t.createdAt,
        isActive: t.isActive,
      }));

      console.info(
        `🧠 [LearningWorker] Sending ${batchContext.length} tokens to Eliza for strategy review...`,
      );

      // 3. Eliza Reasoning Layer (Batch Strategy Simulation)
      const recommendation = await this.generateRecommendation(batchContext, config);

      if (recommendation) {
        console.info(
          `🛡️ [LearningWorker] Eliza Recommendation: Update weight 'baseScore' from ${config.weights.baseScore} to ${recommendation.weights.baseScore}`,
        );

        // 4. Autonomous Execution (Godmode Toggle)
        if (config.autoTuning) {
          console.info('🚀 [LearningWorker] Auto-Tuning ENABLED. Applying batch update instantly.');
          await this.tuner.updateConfig(recommendation, 'AI:ELIZA_BATCH_LEARNING');
        }
      }
    } catch (err) {
      console.error('❌ [LearningWorker] Batch learning failed:', err);
    }
  }

  private async generateRecommendation(
    batch: BatchToken[],
    current: ScoringConfig,
  ): Promise<ScoringConfig | null> {
    // 🧬 HEURISTIC DELTA LOGIC (Institutional Standard)
    const highScored = batch.filter((t) => (t.baseScore || 0) > 80);
    const failures = highScored.filter((t) => !t.isActive).length;
    const failureRate = highScored.length > 0 ? failures / highScored.length : 0;

    if (failureRate > 0.5) {
      // Market shift detected: Sentiment is too bullish, adjust filters up.
      return {
        ...current,
        version: `${current.version}-learned-${Date.now()}`,
        updatedAt: Date.now(),
        l1Threshold: Math.min(current.l1Threshold + 2, 85),
        weights: {
          ...current.weights,
          baseScore: Math.max(current.weights.baseScore - 5, 10),
        },
      };
    }

    return null;
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
