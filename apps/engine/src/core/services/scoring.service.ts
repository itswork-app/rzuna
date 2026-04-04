export interface InitialScore {
  score: number;
  isPremium: boolean;
}

/**
 * 🏛️ ScoringService: Dual-Path Intelligence (V22.1)
 * Level 1: Fast heuristic pre-filter (<1ms per event).
 * Purpose: Filter noise, let promising candidates pass to Level 2 (AI Reasoning).
 *
 * Scoring Rules (calibrated against 150 real Pump.fun tokens):
 * - Base: 30 (neutral starting point)
 * - Liquidity signals: vSol, marketCap
 * - Transaction context: buy momentum, dev dump detection
 * - Social signals: twitter, website, telegram presence
 * - Token metadata quality: name/symbol validation
 *
 * L1 Threshold: 65 → passes to Level 2 AI
 * Premium: score >= 80 → marked as high-priority for VIP users
 */
export class ScoringService {
  // L1 pre-filter threshold — candidates above this go to AI reasoning (Level 2)
  readonly L1_THRESHOLD = 65;

  /**
   * 🛡️ Level 1: Machine Processing (Heuristic & Stream Context)
   * Rapid calculation (<1ms) for every event in the stream.
   */
  calculateInitialScore(event: any): InitialScore {
    let score = 30;

    // ── Liquidity Signals ──
    // Real data: new tokens ~30 vSol, graduated tokens ~115 vSol
    if (event.vSolInBondingCurve > 20) score += 10; // Has initial liquidity
    if (event.vSolInBondingCurve > 50) score += 10; // Strong liquidity
    if (event.vSolInBondingCurve > 100) score += 5; // Graduated-tier

    // Real data: new tokens ~15 mcapSol, top tokens 40K+ mcapSol
    if (event.marketCapSol > 10) score += 10; // Minimum viable market cap
    if (event.marketCapSol > 50) score += 5; // Growing traction
    if (event.marketCapSol > 500) score += 5; // Established

    // ── Transaction Context ──
    if (event.txType === 'buy') score += 8; // Buy pressure = bullish signal
    if (event.txType === 'create') score += 3; // New token creation (mild positive)

    // ── Social Signals (from PumpPortal stream or metadata) ──
    if (event.twitter || event.uri?.includes('twitter')) score += 5;
    if (event.website || event.uri?.includes('http')) score += 3;
    if (event.telegram) score += 3;

    // ── Token Quality ──
    // Legitimate projects have proper names, not random strings
    if (event.symbol && event.symbol.length <= 8 && /^[A-Z]+$/i.test(event.symbol)) score += 2;
    if (event.name && event.name.length >= 3 && event.name.length <= 30) score += 2;

    // ── Hard Red Flags ──
    // Dev dumping their own token is a massive red flag
    if (event.txType === 'sell' && event.traderPublicKey === event.devPublicKey) {
      score = Math.min(score, 20);
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      isPremium: score >= 80,
    };
  }

  /**
   * 🛡️ Triple-Override Persistence Logic
   */
  shouldPersist(score: number, inPortfolio: boolean, inWishlist: boolean): boolean {
    return score >= this.L1_THRESHOLD || inPortfolio || inWishlist;
  }
}
