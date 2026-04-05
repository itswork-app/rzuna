import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';
import { ScoringConfig } from '../core/services/tuning.service.js';

const MOCK_CONFIG: ScoringConfig = {
  version: '1.0.0',
  updatedAt: Date.now(),
  author: 'TEST',
  l1Threshold: 65,
  autoTuning: false,
  weights: {
    baseScore: 30,
    vSolGT20: 10,
    vSolGT50: 10,
    vSolGT100: 5,
    mcapGT10: 10,
    mcapGT50: 5,
    mcapGT500: 5,
    txBuy: 8,
    txCreate: 3,
    twitter: 5,
    website: 3,
    telegram: 3,
    symbolQuality: 2,
    nameQuality: 2,
  },
};

describe('ScoringService (L1 Pre-Filter + Safety)', () => {
  const service = new ScoringService();

  // ── BASIC SCORING ──

  it('SHOULD assign low score for minimal event (no signals)', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 5,
        marketCapSol: 3,
        txType: 'none',
      },
      MOCK_CONFIG,
    );
    expect(result.score).toBe(30);
    expect(result.isPremium).toBe(false);
    expect(result.redFlags).toEqual([]);
  });

  it('SHOULD score a typical new token with social links above L1', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 30,
        marketCapSol: 15,
        txType: 'create',
        symbol: 'ALPHA',
        name: 'Alpha Token',
        twitter: 'https://x.com/alpha',
        website: 'https://alpha.io',
      },
      MOCK_CONFIG,
    );
    expect(result.score).toBeGreaterThanOrEqual(MOCK_CONFIG.l1Threshold);
  });

  it('SHOULD boost score for high-liquidity buy events', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 120,
        marketCapSol: 600,
        txType: 'buy',
        symbol: 'MOODENG',
        name: 'Moo Deng',
        twitter: 'yes',
        website: 'yes',
        telegram: 'yes',
      },
      MOCK_CONFIG,
    );
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.isPremium).toBe(true);
  });

  // ── ANTI-RUGPULL ──

  it('🛡️ ANTI-RUGPULL: Should hard-cap score on developer dump', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 100,
        marketCapSol: 1000,
        txType: 'sell',
        traderPublicKey: 'dev_123',
        devPublicKey: 'dev_123',
      },
      MOCK_CONFIG,
    );
    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.redFlags).toContain('DEV_DUMP');
  });

  it('🛡️ ANTI-RUGPULL: Should penalize micro-liquidity honeypots', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 2,
        marketCapSol: 1,
        txType: 'create',
        symbol: 'SCAM',
        name: 'Scam Token',
      },
      MOCK_CONFIG,
    );
    expect(result.redFlags).toContain('MICRO_LIQUIDITY');
    expect(result.score).toBeLessThan(MOCK_CONFIG.l1Threshold);
  });

  // ── ANTI-WASH TRADING ──

  it('🛡️ ANTI-WASH: Should penalize self-buying (creator buys own token)', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 60,
        marketCapSol: 30,
        txType: 'buy',
        traderPublicKey: 'creator_abc',
        devPublicKey: 'creator_abc',
      },
      MOCK_CONFIG,
    );
    expect(result.redFlags).toContain('SELF_BUY');
    expect(result.score).toBeLessThan(MOCK_CONFIG.l1Threshold);
  });

  // ── PERSISTENCE LOGIC ──

  it('SHOULD persist if score meets L1 threshold', () => {
    expect(service.shouldPersist(65, false, false, 65)).toBe(true);
    expect(service.shouldPersist(64, false, false, 65)).toBe(false);
  });

  it('SHOULD persist if in portfolio even with low score', () => {
    expect(service.shouldPersist(20, true, false, 65)).toBe(true);
    expect(service.shouldPersist(20, false, true, 65)).toBe(true);
  });

  // ── REPUTATION & SECURITY ──

  it('SHOULD apply reputation modifier and security score', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 30,
        marketCapSol: 15,
        txType: 'buy',
        _reputationModifier: 10,
        _reputationFlag: 'CREATOR_TRUSTED',
        _securityScore: 5,
        _securityFlags: ['MINT_REVOKED'],
      },
      MOCK_CONFIG,
    );
    // Base 30 + 10(liq) + 10(mcap) + 8(buy) + 10(rep) + 5(sec) = 73
    expect(result.score).toBe(73);
    expect(result.redFlags).toContain('CREATOR_TRUSTED');
    expect(result.redFlags).toContain('MINT_REVOKED');
  });

  it('SHOULD penalize based on token age', () => {
    // Too new (< 1 min)
    const result1 = service.calculateInitialScore(
      { vSolInBondingCurve: 30, _ageMinutes: 0.5 },
      MOCK_CONFIG,
    );
    // Base 30 + 10(liq) - 5(age) = 35
    expect(result1.score).toBe(35);

    // Sweet spot (5-60 min)
    const result2 = service.calculateInitialScore(
      { vSolInBondingCurve: 30, _ageMinutes: 10 },
      MOCK_CONFIG,
    );
    // Base 30 + 10(liq) + 3(age) = 43
    expect(result2.score).toBe(43);

    // Stale (> 24 hr)
    const result3 = service.calculateInitialScore(
      { vSolInBondingCurve: 30, _ageMinutes: 1500 },
      MOCK_CONFIG,
    );
    // Base 30 + 10(liq) - 3(age) = 37
    expect(result3.score).toBe(37);
  });

  it('SHOULD flag volume spikes and repetitive trading', () => {
    const result = service.calculateInitialScore(
      {
        vSolInBondingCurve: 30,
        _tradesPerMinute: 40,
        isRepetitive: true,
      },
      MOCK_CONFIG,
    );
    expect(result.redFlags).toContain('VOLUME_SPIKE');
  });
});
