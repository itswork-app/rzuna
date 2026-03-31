import { GeyserService } from '../infrastructure/solana/geyser.service.js';
import { ScoringService } from './scoring/scoring.service.js';

/**
 * RZUNA Intelligence Engine
 * Orchestrates signals from Solana data streams with scoring intelligence.
 */
export class IntelligenceEngine {
  private geyser: GeyserService;
  private scorer: ScoringService;

  constructor() {
    this.scorer = new ScoringService();
    this.geyser = new GeyserService(this.scorer);
  }

  async start() {
    this.geyser.on('alpha', (signal) => {
      console.warn(
        `[ALPHA-SIGNAL] ${signal.event.metadata?.symbol} - Score: ${signal.score} | Mint: ${signal.event.mint}`,
      );
    });

    await this.geyser.start();
  }

  stop() {
    this.geyser.removeAllListeners();
  }
}
