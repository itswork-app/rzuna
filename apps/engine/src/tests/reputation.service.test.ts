import { describe, it, expect } from 'vitest';
import { CreatorReputationService } from '../core/services/reputation.service.js';

describe('CreatorReputationService (L1 Blacklist)', () => {
  it('SHOULD return null for unknown creators', () => {
    const rep = new CreatorReputationService();
    expect(rep.getProfile('unknown_wallet')).toBeNull();
    expect(rep.getScoreModifier('unknown_wallet')).toEqual({ modifier: 0, reputation: 'UNKNOWN' });
  });

  it('SHOULD mark creator as SUSPICIOUS after 1 rugpull', () => {
    const rep = new CreatorReputationService();
    rep.recordCreation('bad_dev');
    rep.recordRugpull('bad_dev');

    const profile = rep.getProfile('bad_dev');
    expect(profile?.reputation).toBe('SUSPICIOUS');
    expect(rep.getScoreModifier('bad_dev').modifier).toBe(-20);
    expect(rep.getScoreModifier('bad_dev').redFlag).toBe('CREATOR_SUSPICIOUS');
  });

  it('SHOULD BLACKLIST creator after 2+ rugpulls', () => {
    const rep = new CreatorReputationService();
    rep.recordCreation('serial_rugger');
    rep.recordRugpull('serial_rugger');
    rep.recordRugpull('serial_rugger');

    const profile = rep.getProfile('serial_rugger');
    expect(profile?.reputation).toBe('BLACKLISTED');
    expect(rep.getScoreModifier('serial_rugger').modifier).toBe(-50);
    expect(rep.getScoreModifier('serial_rugger').redFlag).toBe('CREATOR_BLACKLISTED');
  });

  it('SHOULD mark creator as TRUSTED after 5+ successful tokens', () => {
    const rep = new CreatorReputationService();
    for (let i = 0; i < 5; i++) {
      rep.recordCreation('good_dev');
      rep.recordSuccess('good_dev');
    }

    expect(rep.getProfile('good_dev')?.reputation).toBe('TRUSTED');
    expect(rep.getScoreModifier('good_dev').modifier).toBe(10);
  });

  it('SHOULD mark SUSPICIOUS after 3+ wash trades', () => {
    const rep = new CreatorReputationService();
    rep.recordCreation('washer');
    rep.recordWashTrade('washer');
    rep.recordWashTrade('washer');
    rep.recordWashTrade('washer');

    expect(rep.getProfile('washer')?.reputation).toBe('SUSPICIOUS');
  });

  it('SHOULD be O(1) lookup — handle 10000 profiles instantly', () => {
    const rep = new CreatorReputationService();
    for (let i = 0; i < 10000; i++) {
      rep.recordCreation(`wallet_${i}`);
    }

    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      rep.getScoreModifier(`wallet_${i}`);
    }
    const elapsed = performance.now() - start;

    // 10000 lookups must complete in < 50ms (relaxed for GitHub Actions CI)
    expect(elapsed).toBeLessThan(50);
    expect(rep.getStats().total).toBe(10000);
  });

  it('SHOULD ignore empty or UNKNOWN wallets gracefully', () => {
    const rep = new CreatorReputationService();
    rep.recordCreation('');
    rep.recordCreation('UNKNOWN');
    rep.recordRugpull('');

    expect(rep.getStats().total).toBe(0);
  });
});
