export interface InitialScore {
  score: number;
  isPremium: boolean;
}

/**
 * 🏛️ ScoringService: Dual-Path Intelligence (V22.1)
 * Standar: Canonical Master Blueprint v22.1 (The Muscles)
 */
export class ScoringService {
  private readonly SIGNAL_THRESHOLD = 88;

  /**
   * 🛡️ Path 1: Machine Processing (Heuristic & Stream Context)
   * Rapid calculation (<5ms) for every event in the stream.
   */
  calculateInitialScore(event: any): InitialScore {
    let score = 50;

    // Heuristics based on stream data (PumpPortal)
    if (event.vSolInBondingCurve > 50) score += 20;
    if (event.marketCapSol > 100) score += 15;
    if (event.txType === 'buy') score += 10;

    // Hard Red Flag: If dev dumped, penalize
    if (event.txType === 'sell' && event.traderPublicKey === event.devPublicKey) {
      score = Math.min(score, 30);
    }

    return {
      score: Math.min(100, score),
      isPremium: score >= 90,
    };
  }

  /**
   * 🛡️ Triple-Override Persistence Logic
   */
  shouldPersist(score: number, inPortfolio: boolean, inWishlist: boolean): boolean {
    return score >= this.SIGNAL_THRESHOLD || inPortfolio || inWishlist;
  }
}
