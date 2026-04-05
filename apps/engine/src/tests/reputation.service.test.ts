import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreatorReputationService } from '../core/services/reputation.service.js';

describe('CreatorReputationService (L1 Blacklist)', () => {
  let rep: CreatorReputationService;

  beforeEach(() => {
    vi.clearAllMocks();
    rep = new CreatorReputationService();
  });

  it('SHOULD return null for unknown creators', () => {
    expect(rep.getProfile('unknown_wallet')).toBeNull();
    expect(rep.getScoreModifier('unknown_wallet')).toEqual({ modifier: 0, reputation: 'UNKNOWN' });
  });

  it('SHOULD mark creator as SUSPICIOUS after 1 rugpull', () => {
    rep.recordCreation('bad_dev');
    rep.recordRugpull('bad_dev');

    const profile = rep.getProfile('bad_dev');
    expect(profile?.reputation).toBe('SUSPICIOUS');
    expect(rep.getScoreModifier('bad_dev').modifier).toBe(-20);
    expect(rep.getScoreModifier('bad_dev').redFlag).toBe('CREATOR_SUSPICIOUS');
  });

  it('SHOULD BLACKLIST creator after 2+ rugpulls', () => {
    rep.recordCreation('serial_rugger');
    rep.recordRugpull('serial_rugger');
    rep.recordRugpull('serial_rugger');

    const profile = rep.getProfile('serial_rugger');
    expect(profile?.reputation).toBe('BLACKLISTED');
    expect(rep.getScoreModifier('serial_rugger').modifier).toBe(-50);
    expect(rep.getScoreModifier('serial_rugger').redFlag).toBe('CREATOR_BLACKLISTED');
  });

  it('SHOULD mark creator as TRUSTED after 5+ successful tokens', () => {
    for (let i = 0; i < 5; i++) {
      rep.recordCreation('good_dev');
      rep.recordSuccess('good_dev');
    }

    expect(rep.getProfile('good_dev')?.reputation).toBe('TRUSTED');
    expect(rep.getScoreModifier('good_dev').modifier).toBe(10);
  });

  it('SHOULD mark SUSPICIOUS after 3+ wash trades', () => {
    rep.recordCreation('washer');
    rep.recordWashTrade('washer');
    rep.recordWashTrade('washer');
    rep.recordWashTrade('washer');

    expect(rep.getProfile('washer')?.reputation).toBe('SUSPICIOUS');
  });

  it('SHOULD hydrate from Redis successfully', async () => {
    // 🏛️ Setup: Mock hgetall to return one blacklisted wallet
    vi.spyOn((rep as any).redis, 'hgetall').mockResolvedValueOnce({
      wallet_redis: JSON.stringify({
        wallet: 'wallet_redis',
        rugCount: 5,
        reputation: 'BLACKLISTED',
      }),
    });

    // 🏛️ Manually trigger hydration (usually happens on engine boot)
    await rep.hydrateFromRedis();
    const profile = rep.getProfile('wallet_redis');
    expect(profile?.reputation).toBe('BLACKLISTED');
  });

  it('SHOULD handle Redis hydration errors gracefully', async () => {
    const errorRep = new CreatorReputationService();
    // Force an error in hgetall
    vi.spyOn((errorRep as any).redis, 'hgetall').mockRejectedValueOnce(new Error('Redis Down'));

    await expect(errorRep.hydrateFromRedis()).resolves.not.toThrow();
    expect(errorRep.getStats().total).toBe(0);
  });

  it('SHOULD catch sync errors silently', async () => {
    const syncRep = new CreatorReputationService();
    // Force an error in hset which is fire-and-forget
    vi.spyOn((syncRep as any).redis, 'hset').mockRejectedValueOnce(new Error('Sync Fail'));

    // Should NOT throw
    syncRep.recordCreation('sync_test');
    expect(syncRep.getProfile('sync_test')).toBeDefined();
  });

  it('SHOULD be O(1) lookup — handle 10000 profiles instantly', () => {
    for (let i = 0; i < 10000; i++) {
      rep.recordCreation(`wallet_${i}`);
    }

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      rep.getScoreModifier(`wallet_${i}`);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100); // Relaxed for CI
    expect(rep.getStats().total).toBe(10000);
  });

  it('SHOULD ignore empty or UNKNOWN wallets gracefully', () => {
    rep.recordCreation('');
    rep.recordCreation('UNKNOWN');
    rep.recordRugpull('');

    expect(rep.getStats().total).toBe(0);
  });
});
