import { describe, it, expect } from 'vitest';
import { ScoringService } from '../core/services/scoring.service.js';

describe('ScoringService (Intel Machine)', () => {
  const service = new ScoringService();

  it('SHOULD calculate base score for default event', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 10,
      marketCapSol: 10,
      txType: 'none',
    });
    expect(result.score).toBe(50);
    expect(result.isPremium).toBe(false);
  });

  it('SHOULD boost score for bonding curve progress', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 60,
      marketCapSol: 110,
      txType: 'buy',
    });
    // 50 + 20 + 15 + 10 = 95
    expect(result.score).toBe(95);
    expect(result.isPremium).toBe(true);
  });

  it('SHOULD penalize dev dumping', () => {
    const result = service.calculateInitialScore({
      vSolInBondingCurve: 100,
      marketCapSol: 1000,
      txType: 'sell',
      traderPublicKey: 'dev_123',
      devPublicKey: 'dev_123',
    });
    // Base 50, even with boosts, dev dump caps at 30
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it('SHOULD recommend persistence based on threshold', () => {
    expect(service.shouldPersist(90, false, false)).toBe(true);
    expect(service.shouldPersist(80, true, false)).toBe(true);
    expect(service.shouldPersist(80, false, false)).toBe(false);
  });
});
