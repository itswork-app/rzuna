import { ScoringConfig } from './tuning.service.js';

export interface InitialScore {
  score: number;
  isPremium: boolean;
  redFlags: string[];
}

/**
 * 🏛️ ScoringService: Dual-Path Intelligence (V22.2)
 * Level 1: Fast heuristic pre-filter and adaptive "Godmode" tuning.
 * Standard: Adaptive Singularity (Master Blueprint V22.2)
 *
 * Scoring logic consumes real-time weights from TuningService.
 */
export class ScoringService {
  /**
   * 🛡️ Level 1: Machine Processing (Heuristic & Stream Context)
   * Rapid calculation (<1ms) using dynamic weights.
   */
  calculateInitialScore(event: any, config: ScoringConfig): InitialScore {
    const { weights } = config;
    let score = weights.baseScore;
    const redFlags: string[] = [];

    // ═══════════════════════════════════════════
    // 🟢 POSITIVE SIGNALS (Adaptive Godmode Weights)
    // ═══════════════════════════════════════════

    // ── Liquidity Signals ──
    if (event.vSolInBondingCurve > 20) score += weights.vSolGT20;
    if (event.vSolInBondingCurve > 50) score += weights.vSolGT50;
    if (event.vSolInBondingCurve > 100) score += weights.vSolGT100;

    // ── Market Cap Signals ──
    if (event.marketCapSol > 10) score += weights.mcapGT10;
    if (event.marketCapSol > 50) score += weights.mcapGT50;
    if (event.marketCapSol > 500) score += weights.mcapGT500;

    // ── Transaction Context ──
    if (event.txType === 'buy') score += weights.txBuy;
    if (event.txType === 'create') score += weights.txCreate;

    // ── Social Signals ──
    if (event.twitter || event.uri?.includes('twitter')) score += weights.twitter;
    if (event.website || event.uri?.includes('http')) score += weights.website;
    if (event.telegram) score += weights.telegram;

    // ── Token Quality ──
    if (event.symbol && event.symbol.length <= 8 && /^[A-Z]+$/i.test(event.symbol))
      score += weights.symbolQuality;
    if (event.name && event.name.length >= 3 && event.name.length <= 30)
      score += weights.nameQuality;

    // ── Token Age (injected by engine) ──
    if (event._ageMinutes !== undefined) {
      if (event._ageMinutes < 1) score -= 5;
      else if (event._ageMinutes >= 5 && event._ageMinutes <= 60) score += 3;
      else if (event._ageMinutes > 1440) score -= 3;
    }

    // ── Volume Velocity ──
    if (event._tradesPerMinute && event._tradesPerMinute > 30) {
      redFlags.push('VOLUME_SPIKE');
      score -= 10;
    }

    // ── On-Chain Security ──
    if (event._securityScore !== undefined) {
      score += event._securityScore;
      if (event._securityFlags) redFlags.push(...event._securityFlags);
    }

    // ═══════════════════════════════════════════
    // 🔴 ANTI-RUGPULL DETECTION
    // ═══════════════════════════════════════════
    if (
      event.txType === 'sell' &&
      event.traderPublicKey &&
      event.traderPublicKey === event.devPublicKey
    ) {
      score = Math.min(score, 20);
      redFlags.push('DEV_DUMP');
    }

    // 🛡️ ANTI-WASH: Creator self-buying own token
    if (
      event.txType === 'buy' &&
      event.traderPublicKey &&
      event.traderPublicKey === event.devPublicKey
    ) {
      score -= 30;
      redFlags.push('SELF_BUY');
    }

    if (event.vSolInBondingCurve < 5 && event.txType === 'create') {
      score -= 15;
      redFlags.push('MICRO_LIQUIDITY');
    }

    // ═══════════════════════════════════════════
    // 🟡 CREATOR REPUTATION
    // ═══════════════════════════════════════════
    if (event._reputationModifier) {
      score += event._reputationModifier;
      if (event._reputationFlag) redFlags.push(event._reputationFlag);
    }

    return {
      score: Math.min(100, Math.max(0, score)),
      isPremium: score >= 80, // Premium benchmark constant for VIP tiering
      redFlags,
    };
  }

  /**
   * 🛡️ Adaptive Persistence Logic
   */
  shouldPersist(
    score: number,
    inPortfolio: boolean,
    inWishlist: boolean,
    l1Threshold: number,
  ): boolean {
    return score >= l1Threshold || inPortfolio || inWishlist;
  }
}
