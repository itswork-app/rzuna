import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntelligenceEngine } from '../src/core/engine.js';
import { UserRank, SubscriptionStatus } from '../src/core/types/user.js';

describe('🛡️ IntelligenceEngine NUCLEAR Branch Coverage', () => {
  let engine: IntelligenceEngine;

  beforeEach(() => {
    engine = new IntelligenceEngine();
    vi.clearAllMocks();
  });

  it('should cover ALL access branches (The Matrix)', () => {
    const ranks = [UserRank.NEWBIE, UserRank.PRO, UserRank.ELITE];
    const statuses = [
      SubscriptionStatus.NONE,
      SubscriptionStatus.STARLIGHT,
      SubscriptionStatus.STARLIGHT_PLUS,
      SubscriptionStatus.VIP,
    ];

    // Add one premium and one standard signal
    // @ts-expect-error - Accessing private activeSignals for test setup
    engine.activeSignals.set('P', {
      id: 'P',
      isPremium: true,
      score: 95,
      aiReasoning: { narrative: 'P' },
      metadata: {},
    } as any);
    // @ts-expect-error - Accessing private activeSignals for test setup
    engine.activeSignals.set('S', {
      id: 'S',
      isPremium: false,
      score: 85,
      aiReasoning: { narrative: 'S' },
      metadata: {},
    } as any);

    for (const rank of ranks) {
      for (const status of statuses) {
        const isStarlight = status === SubscriptionStatus.STARLIGHT;
        const isStarlightPlus = status === SubscriptionStatus.STARLIGHT_PLUS;
        const isVIP = status === SubscriptionStatus.VIP;

        vi.spyOn(Math, 'random').mockReturnValue(0.05); // Access always granted for prob logic

        const signals = engine.getTieredSignals(rank, isStarlight || isStarlightPlus, isVIP, {
          aiQuotaLimit: 10,
          aiQuotaUsed: 0,
        });

        expect(signals.length).toBeGreaterThan(0);

        // Trigger Quota Exhausted branch
        engine.getTieredSignals(rank, isStarlight, isVIP, { aiQuotaLimit: 5, aiQuotaUsed: 5 });
      }
    }
  });
});
