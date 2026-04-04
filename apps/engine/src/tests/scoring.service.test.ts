import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';

describe('ScoringService (L1 Pre-Filter + Safety)', () => {
  const service = new ScoringService();

  // ── BASIC SCORING ──

  it('SHOULD assign low score for minimal event (no signals)', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 5,
      marketCapSol: 3,
      txType: 'none',
    });
    expect(result.score).toBe(30);
    expect(result.isPremium).toBe(false);
    expect(result.redFlags).toEqual([]);
  });

  it('SHOULD score a typical new token with social links above L1', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 30,
      marketCapSol: 15,
      txType: 'create',
      symbol: 'ALPHA',
      name: 'Alpha Token',
      twitter: 'https://x.com/alpha',
      website: 'https://alpha.io',
    });
    expect(result.score).toBeGreaterThanOrEqual(service.L1_THRESHOLD);
  });

  it('SHOULD boost score for high-liquidity buy events', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 120,
      marketCapSol: 600,
      txType: 'buy',
      symbol: 'MOODENG',
      name: 'Moo Deng',
      twitter: 'yes',
      website: 'yes',
      telegram: 'yes',
    });
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.isPremium).toBe(true);
  });

  // ── ANTI-RUGPULL ──

  it('🛡️ ANTI-RUGPULL: Should hard-cap score on developer dump', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 100,
      marketCapSol: 1000,
      txType: 'sell',
      traderPublicKey: 'dev_123',
      devPublicKey: 'dev_123',
    });
    expect(result.score).toBeLessThanOrEqual(20);
    expect(result.redFlags).toContain('DEV_DUMP');
  });

  it('🛡️ ANTI-RUGPULL: Should penalize micro-liquidity honeypots', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 2,
      marketCapSol: 1,
      txType: 'create',
      symbol: 'SCAM',
      name: 'Scam Token',
    });
    expect(result.redFlags).toContain('MICRO_LIQUIDITY');
    expect(result.score).toBeLessThan(service.L1_THRESHOLD);
  });

  it('🛡️ ANTI-RUGPULL: Should flag bonding curve mismatch', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 90,
      marketCapSol: 10,
      txType: 'buy',
    });
    expect(result.redFlags).toContain('CURVE_MISMATCH');
  });

  it('🛡️ ANTI-RUGPULL: Should flag anonymous projects with no social', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 30,
      marketCapSol: 15,
      txType: 'create',
      symbol: 'ANON',
      name: 'Anonymous',
    });
    expect(result.redFlags).toContain('NO_SOCIAL');
  });

  // ── ANTI-WASH TRADING ──

  it('🛡️ ANTI-WASH: Should penalize self-buying (creator buys own token)', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 60,
      marketCapSol: 30,
      txType: 'buy',
      traderPublicKey: 'creator_abc',
      devPublicKey: 'creator_abc',
    });
    expect(result.redFlags).toContain('SELF_BUY');
    expect(result.score).toBeLessThan(service.L1_THRESHOLD);
  });

  it('🛡️ ANTI-WASH: Should penalize micro-amount trades', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 40,
      marketCapSol: 20,
      txType: 'buy',
      solAmount: 0.001,
    });
    expect(result.redFlags).toContain('MICRO_TRADE');
  });

  // ── PERSISTENCE LOGIC ──

  it('SHOULD persist if score meets L1 threshold', () => {
    expect(service.shouldPersist(65, false, false)).toBe(true);
    expect(service.shouldPersist(64, false, false)).toBe(false);
  });

  it('SHOULD persist if in portfolio even with low score', () => {
    expect(service.shouldPersist(20, true, false)).toBe(true);
    expect(service.shouldPersist(20, false, true)).toBe(true);
  });
});
