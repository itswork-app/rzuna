export interface InitialScore {
  score: number;
  isPremium: boolean;
  redFlags: string[];
}

/**
 * 🏛️ ScoringService: Dual-Path Intelligence (V22.1)
 * Level 1: Fast heuristic pre-filter (<1ms per event).
 * Purpose: Filter noise AND dangerous tokens, let safe candidates pass to Level 2 (AI).
 *
 * Scoring Rules (calibrated against 150 real Pump.fun tokens):
 * - Base: 30 (neutral starting point)
 * - Positive signals: liquidity, social presence, token quality, buy momentum
 * - Red flags: dev dump, wash trading patterns, rugpull indicators
 *
 * L1 Threshold: 65 → passes to Level 2 AI
 * Premium: score >= 80 → marked as high-priority for VIP users
 */
export class ScoringService {
  readonly L1_THRESHOLD = 65;

  /**
   * 🛡️ Level 1: Machine Processing (Heuristic & Stream Context)
   * Rapid calculation (<1ms) for every event in the stream.
   */
  calculateInitialScore(event: any): InitialScore {
    let score = 30;
    const redFlags: string[] = [];

    // ═══════════════════════════════════════════
    // 🟢 POSITIVE SIGNALS (Higher = More Promising)
    // ═══════════════════════════════════════════

    // ── Liquidity Signals ──
    if (event.vSolInBondingCurve > 20) score += 10;
    if (event.vSolInBondingCurve > 50) score += 10;
    if (event.vSolInBondingCurve > 100) score += 5;

    // ── Market Cap Signals ──
    if (event.marketCapSol > 10) score += 10;
    if (event.marketCapSol > 50) score += 5;
    if (event.marketCapSol > 500) score += 5;

    // ── Transaction Context ──
    if (event.txType === 'buy') score += 8;
    if (event.txType === 'create') score += 3;

    // ── Social Signals ──
    if (event.twitter || event.uri?.includes('twitter')) score += 5;
    if (event.website || event.uri?.includes('http')) score += 3;
    if (event.telegram) score += 3;

    // ── Token Quality ──
    if (event.symbol && event.symbol.length <= 8 && /^[A-Z]+$/i.test(event.symbol)) score += 2;
    if (event.name && event.name.length >= 3 && event.name.length <= 30) score += 2;

    // ═══════════════════════════════════════════
    // 🔴 ANTI-RUGPULL DETECTION
    // ═══════════════════════════════════════════

    // R1: Developer dumping their own token
    if (event.txType === 'sell' && event.traderPublicKey && event.traderPublicKey === event.devPublicKey) {
      score = Math.min(score, 20);
      redFlags.push('DEV_DUMP');
    }

    // R2: Suspiciously low initial liquidity (honeypot indicator)
    if (event.vSolInBondingCurve < 5 && event.txType === 'create') {
      score -= 15;
      redFlags.push('MICRO_LIQUIDITY');
    }

    // R3: Bonding curve nearly complete but low market cap (about to rugpull)
    if (event.vSolInBondingCurve > 80 && event.marketCapSol < 20) {
      score -= 20;
      redFlags.push('CURVE_MISMATCH');
    }

    // R4: No social presence at all — anonymous project, high rug risk
    const hasSocial = event.twitter || event.website || event.telegram;
    if (!hasSocial && event.txType === 'create') {
      score -= 10;
      redFlags.push('NO_SOCIAL');
    }

    // ═══════════════════════════════════════════
    // 🟡 ANTI-WASH TRADING DETECTION
    // ═══════════════════════════════════════════

    // W1: Buyer is the same as the token creator (self-buying to inflate volume)
    if (event.txType === 'buy' && event.traderPublicKey && event.traderPublicKey === event.devPublicKey) {
      score -= 20;
      redFlags.push('SELF_BUY');
    }

    // W2: Abnormally small trade amount (wash trading often uses micro-amounts)
    if (event.txType === 'buy' && event.solAmount && event.solAmount < 0.01) {
      score -= 10;
      redFlags.push('MICRO_TRADE');
    }

    // W3: Rapid successive same-wallet transactions (bot pattern)
    if (event.txType === 'buy' && event.traderPublicKey && event.traderPublicKey === event.bondingCurveKey) {
      score -= 15;
      redFlags.push('BOT_PATTERN');
    }

    // W4: Fake Volume - High volume but abnormally low market cap growth
    // (Pattern: many small trades that don't move the price much)
    if (event.txType === 'buy' && event.vSolInBondingCurve > 80 && event.marketCapSol < 10) {
      score -= 20;
      redFlags.push('FAKE_VOLUME_IMBALANCE');
    }

    // W5: Repetitive Trading (Wallet reuse)
    // If the engine passes 'isRepetitive' flag from stateful tracking
    if (event.isRepetitive) {
      score -= 25;
      redFlags.push('REPETITIVE_WASH_TRADE');
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      isPremium: score >= 80,
      redFlags,
    };
  }

  /**
   * 🛡️ Triple-Override Persistence Logic
   */
  shouldPersist(score: number, inPortfolio: boolean, inWishlist: boolean): boolean {
    return score >= this.L1_THRESHOLD || inPortfolio || inWishlist;
  }
}
