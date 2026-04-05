import { Connection, PublicKey } from '@solana/web3.js';
import { env } from '../../utils/env.js';

export interface TokenSecurityReport {
  mintAuthorityRevoked: boolean;
  freezeAuthorityRevoked: boolean;
  topHolderPct: number; // 0-100, percentage held by largest holder
  holderCount: number;
  isLpLocked: boolean;
  redFlags: string[];
  score: number; // -50 to +10 modifier
}

/**
 * 🏛️ TokenSecurityService: On-Chain Authority & Holder Analysis
 * Queries Solana RPC for mint/freeze authority status and holder concentration.
 * Used by L1 enrichment loop to detect rugpull risks that stream data can't reveal.
 */
export class TokenSecurityService {
  private connection: Connection;
  private cache: Map<string, { report: TokenSecurityReport; expiry: number }> = new Map();
  private static readonly CACHE_TTL = 60_000; // 60s cache

  constructor() {
    this.connection = new Connection(env.HELIUS_RPC_URL || env.SOLANA_RPC_URL, 'confirmed');
  }

  /**
   * Get security report for a token mint. Cached for 60s.
   * Returns null if RPC fails (graceful degradation).
   */
  async getSecurityReport(mint: string): Promise<TokenSecurityReport | null> {
    // Cache check
    const cached = this.cache.get(mint);
    if (cached && Date.now() < cached.expiry) return cached.report;

    try {
      const [authReport, holderReport] = await Promise.all([
        this.checkAuthorities(mint),
        this.checkHolderConcentration(mint),
      ]);

      const redFlags: string[] = [];
      let score = 0;

      // Mint authority check
      if (!authReport.mintRevoked) {
        redFlags.push('MINT_NOT_REVOKED');
        score -= 25;
      } else {
        score += 5;
      }

      // Freeze authority check
      if (!authReport.freezeRevoked) {
        redFlags.push('FREEZE_NOT_REVOKED');
        score -= 15;
      } else {
        score += 3;
      }

      // Holder concentration
      if (holderReport.topHolderPct > 80) {
        redFlags.push('WHALE_DOMINATED');
        score -= 20;
      } else if (holderReport.topHolderPct > 50) {
        redFlags.push('HIGH_CONCENTRATION');
        score -= 10;
      } else if (holderReport.holderCount > 100) {
        score += 5; // Well-distributed
      }

      // LP lock (simplified — check if bonding curve still holds majority)
      const isLpLocked = holderReport.topHolderPct < 90;

      const report: TokenSecurityReport = {
        mintAuthorityRevoked: authReport.mintRevoked,
        freezeAuthorityRevoked: authReport.freezeRevoked,
        topHolderPct: holderReport.topHolderPct,
        holderCount: holderReport.holderCount,
        isLpLocked,
        redFlags,
        score: Math.max(-50, Math.min(10, score)),
      };

      // Cache it
      this.cache.set(mint, { report, expiry: Date.now() + TokenSecurityService.CACHE_TTL });
      return report;
    } catch (err) {
      console.error(`[Security] Failed to check ${mint}:`, err);
      return null; // Graceful degradation
    }
  }

  private async checkAuthorities(
    mint: string,
  ): Promise<{ mintRevoked: boolean; freezeRevoked: boolean }> {
    const info = await this.connection.getParsedAccountInfo(new PublicKey(mint));
    const data = (info?.value?.data as any)?.parsed?.info;

    if (!data) return { mintRevoked: false, freezeRevoked: false };

    return {
      mintRevoked: data.mintAuthority === null,
      freezeRevoked: data.freezeAuthority === null,
    };
  }

  private async checkHolderConcentration(
    mint: string,
  ): Promise<{ topHolderPct: number; holderCount: number }> {
    try {
      const accounts = await this.connection.getTokenLargestAccounts(new PublicKey(mint));
      const holders = accounts.value;

      if (!holders || holders.length === 0) {
        return { topHolderPct: 100, holderCount: 0 };
      }

      const totalSupply = holders.reduce((sum: number, h: any) => sum + Number(h.amount), 0);
      const topHolderAmt = Number(holders[0].amount);
      const topHolderPct = totalSupply > 0 ? (topHolderAmt / totalSupply) * 100 : 100;

      return {
        topHolderPct: Math.round(topHolderPct * 10) / 10,
        holderCount: holders.length,
      };
    } catch {
      return { topHolderPct: 50, holderCount: 0 }; // Conservative default
    }
  }
}
