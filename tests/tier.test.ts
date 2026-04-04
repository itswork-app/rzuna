/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TierService } from '../src/core/tiers/tier.service.js';
import { UserRank, SubscriptionStatus, type UserProfile } from '../src/core/types/user.js';
import { supabase } from '../src/infrastructure/supabase/client.js';
import { JupiterService } from '../src/infrastructure/jupiter/jupiter.service.js';

// Mock Supabase
vi.mock('../src/infrastructure/supabase/client.js', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    rpc: vi.fn().mockResolvedValue({ data: 'NEWBIE', error: null }),
  },
}));

// Mock Solana
vi.mock('@solana/web3.js', () => ({
  Connection: class {
    async getSignatureStatus() {
      return { value: { err: null } };
    }
    async getParsedTransaction() {
      return { meta: { err: null } };
    }
  },
  PublicKey: class {
    constructor() {}
    toBase58() {
      return 'w1';
    }
  },
  Keypair: { generate: () => ({ publicKey: { toBase58: () => 'w1' } }) },
}));

// Mock env
vi.mock('../src/utils/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    SUPABASE_URL: 'https://test.co',
    SUPABASE_KEY: 'test-key',
    SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  },
}));

const makeProfile = (rank: UserRank, status: SubscriptionStatus): UserProfile => ({
  walletAddress: 'test_wallet',
  rank,
  status,
  volume: { currentMonthVolume: 0, totalFeesPaid: 0, lastResetDate: new Date() },
  createdAt: new Date(),
  lastActiveAt: new Date(),
  isBanned: false,
  aiQuotaLimit: 0,
  aiQuotaUsed: 0,
});

describe('TierService — Dynamic Fee Calculator', () => {
  let service: TierService;

  beforeEach(() => {
    service = new TierService();
  });

  describe('getTradingFeePercentage()', () => {
    it('VIP user pays 0.75%', () => {
      const profile = makeProfile(UserRank.ELITE, SubscriptionStatus.VIP);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0075);
    });

    it('STARLIGHT_PLUS user pays 1.0%', () => {
      const profile = makeProfile(UserRank.PRO, SubscriptionStatus.STARLIGHT_PLUS);
      expect(service.getTradingFeePercentage(profile)).toBe(0.01);
    });

    it('STARLIGHT user pays 1.25%', () => {
      const profile = makeProfile(UserRank.NEWBIE, SubscriptionStatus.STARLIGHT);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0125);
    });

    it('NONE + ELITE pays 1.5%', () => {
      const profile = makeProfile(UserRank.ELITE, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.015);
    });

    it('NONE + PRO pays 1.75%', () => {
      const profile = makeProfile(UserRank.PRO, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.0175);
    });

    it('NONE + NEWBIE pays 2.0%', () => {
      const profile = makeProfile(UserRank.NEWBIE, SubscriptionStatus.NONE);
      expect(service.getTradingFeePercentage(profile)).toBe(0.02);
    });
  });

  describe('getUserProfile() — Default New Wallet', () => {
    it('returns NEWBIE/NONE defaults for unknown wallet', async () => {
      const profile = await service.getUserProfile('unknown_wallet_xyz');
      expect(profile.rank).toBe(UserRank.NEWBIE);
      expect(profile.status).toBe(SubscriptionStatus.NONE);
      expect(profile.isBanned).toBe(false);
    });
  });

  describe('addVolume() — Rank Upgrades', () => {
    it('upgrades user to ELITE when threshold is met', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({ data: 'ELITE', error: null } as any);

      const nextRank = await service.addVolume('w1', 1500);
      expect(nextRank).toBe(UserRank.ELITE);

      expect(supabase.rpc).toHaveBeenCalledWith('add_volume_atomic', {
        p_wallet_address: 'w1',
        p_volume_increment: 1500,
        p_fee_increment: 0,
      });
    });
  });

  describe('performMonthlyReset() — Demotions', () => {
    it('demotes PRO to NEWBIE if not protected', async () => {
      vi.mocked(supabase.from('profiles').select as any).mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { wallet_address: 'w2', rank: 'PRO', subscription_status: 'NONE' },
          error: null,
        }),
      });

      const newRank = await service.performMonthlyReset('w2');
      expect(newRank).toBe(UserRank.NEWBIE);
    });
  });
});

describe('TierService — Rank Protection Logic', () => {
  let service: TierService;
  beforeEach(() => {
    service = new TierService();
  });

  it('STARLIGHT user pays discounted fee — confirming protected status logic', () => {
    // Protected users (STARLIGHT+) always get discounted fee regardless of rank
    const eliteStarlight = makeProfile(UserRank.ELITE, SubscriptionStatus.STARLIGHT);
    const newbieStarlight = makeProfile(UserRank.NEWBIE, SubscriptionStatus.STARLIGHT);
    // Both pay the same STARLIGHT rate — rank does not matter for protected users
    expect(service.getTradingFeePercentage(eliteStarlight)).toBe(0.0125);
    expect(service.getTradingFeePercentage(newbieStarlight)).toBe(0.0125);
  });

  it('VIP always pays lowest fee regardless of rank', () => {
    const newbieVip = makeProfile(UserRank.NEWBIE, SubscriptionStatus.VIP);
    const eliteVip = makeProfile(UserRank.ELITE, SubscriptionStatus.VIP);
    expect(service.getTradingFeePercentage(newbieVip)).toBe(0.0075);
    expect(service.getTradingFeePercentage(eliteVip)).toBe(0.0075);
  });
});

describe('JupiterService — Helpers', () => {
  it('converts fee rate to basis points correctly', () => {
    expect(JupiterService.feeToBps(0.02)).toBe(200);
    expect(JupiterService.feeToBps(0.0075)).toBe(75);
    expect(JupiterService.feeToBps(0.01)).toBe(100);
  });
});
