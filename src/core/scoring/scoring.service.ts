import type { MintEvent } from '../../infrastructure/solana/geyser.service.js';

/**
 * Scoring Result Metadata
 */
export interface ScoringResult {
  score: number;
  reasoning: string[];
  isPremium: boolean; // 90+ scores are marked as premium
}

/**
 * RZUNA Domain Logic: Alpha Intelligence Scoring
 */
export class ScoringService {
  /**
   * Calculates a score from 0 to 100 based on token data.
   */
  calculateScore(event: MintEvent): ScoringResult {
    const reasoning: string[] = [];
    let score = 0;

    const liqScore = this.calculateLiquidityScore(event.initialLiquidity ?? 0);
    score += liqScore;
    reasoning.push(`Liquidity contribution: ${liqScore}`);

    const metaScore = this.calculateMetadataScore(
      event.metadata?.name ?? '',
      event.metadata?.symbol ?? '',
    );
    score += metaScore;
    reasoning.push(`Metadata assessment: ${metaScore}`);

    const socScore = this.calculateSocialScore(event.socialScore);
    score += socScore;
    reasoning.push(`Social sentiment score: ${socScore}`);

    // Normalize to 0-100
    score = Math.max(0, Math.min(100, score));

    // Hard red flag! Mintable tokens must ALWAYS be below 50.
    if (event.metadata && 'isMintable' in event.metadata && event.metadata.isMintable) {
      score = Math.min(score, 49);
      reasoning.push('CRITICAL: Mintable status detected. Token flagged as high risk.');
    }

    return {
      score,
      reasoning,
      isPremium: score >= 90,
    };
  }

  private calculateLiquidityScore(liquidity: number): number {
    if (liquidity < 50) return -20;
    if (liquidity > 500) return 40;
    if (liquidity > 100) return 30;
    return 15;
  }

  private calculateMetadataScore(name: string, symbol: string): number {
    const lowerName = name.toLowerCase();
    const lowerSymbol = symbol.toLowerCase();

    const goodNames = ['legit', 'gem', 'alpha', 'stable', 'gold'];
    const badNames = ['scam', 'rug', 'test', 'rugpull'];

    if (goodNames.some((n) => lowerName.includes(n) || lowerSymbol.includes(n))) {
      return 35;
    }
    if (badNames.some((n) => lowerName.includes(n) || lowerSymbol.includes(n))) {
      return -60;
    }
    return 5;
  }

  private calculateSocialScore(providedScore?: number): number {
    if (providedScore !== undefined) return providedScore;
    return Math.floor(Math.random() * 30);
  }

  shouldSignal(score: number): boolean {
    return score > 80;
  }
}
