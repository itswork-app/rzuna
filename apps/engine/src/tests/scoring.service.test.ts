import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';

describe('ScoringService (Intel Machine — L1 Pre-Filter)', () => {
  const service = new ScoringService();

  it('SHOULD assign low score for minimal event (no signals)', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 5,
      marketCapSol: 3,
      txType: 'none',
    });
    // Base 30 + no bonuses
    expect(result.score).toBe(30);
    expect(result.isPremium).toBe(false);
  });

  it('SHOULD score a typical new token with social links', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 30,
      marketCapSol: 15,
      txType: 'create',
      symbol: 'ALPHA',
      name: 'Alpha Token',
      twitter: 'https://x.com/alpha',
      website: 'https://alpha.io',
    });
    // 30 + 10(vSol>20) + 10(mcap>10) + 3(create) + 5(tw) + 3(web) + 2(symbol) + 2(name) = 65
    expect(result.score).toBe(65);
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
    // 30 + 10 + 10 + 5(>100) + 10(>10) + 5(>50) + 5(>500) + 8(buy) + 5(tw) + 3(web) + 3(tg) + 2(sym) + 2(name) = 98
    expect(result.score).toBe(98);
    expect(result.isPremium).toBe(true);
  });

  it('SHOULD hard-cap score on developer dump', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 100,
      marketCapSol: 1000,
      txType: 'sell',
      traderPublicKey: 'dev_123',
      devPublicKey: 'dev_123',
      twitter: 'yes',
      website: 'yes',
    });
    // Dev dump → capped at 20 regardless of other signals
    expect(result.score).toBeLessThanOrEqual(20);
  });

  it('SHOULD filter noise tokens below L1 threshold', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 10,
      marketCapSol: 5,
      txType: 'create',
    });
    // 30 + 3(create) = 33 → below L1_THRESHOLD (65)
    expect(result.score).toBeLessThan(service.L1_THRESHOLD);
    expect(service.shouldPersist(result.score, false, false)).toBe(false);
  });

  it('SHOULD persist if in portfolio even with low score', () => {
    expect(service.shouldPersist(30, true, false)).toBe(true);
    expect(service.shouldPersist(30, false, true)).toBe(true);
  });

  it('SHOULD persist if score meets L1 threshold', () => {
    expect(service.shouldPersist(65, false, false)).toBe(true);
    expect(service.shouldPersist(64, false, false)).toBe(false);
  });
});
