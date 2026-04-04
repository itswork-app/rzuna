import { subStatusEnum } from '@rzuna/database';

/**
 * 🏛️ TierService: B2B Ecosystem Logic (The Nerve)
 * Standar: Canonical Master Blueprint v22.1 (Phase 4)
 */
export enum B2BTier {
  NONE = 'NONE',
  STARLIGHT = 'STARLIGHT',
  STARLIGHT_PLUS = 'STARLIGHT_PLUS',
  VIP = 'VIP',
}

export interface TierLimits {
  rpm: number;
  creditsPerSignal: number;
  feePercentage: number;
  hasJitoAccess: boolean;
}

export const TIER_CONFIG: Record<B2BTier, TierLimits> = {
  [B2BTier.NONE]: {
    rpm: 1,
    creditsPerSignal: 10,
    feePercentage: 2.0,
    hasJitoAccess: false,
  },
  [B2BTier.STARLIGHT]: {
    rpm: 10,
    creditsPerSignal: 1,
    feePercentage: 1.5,
    hasJitoAccess: false,
  },
  [B2BTier.STARLIGHT_PLUS]: {
    rpm: 100,
    creditsPerSignal: 0,
    feePercentage: 1.0,
    hasJitoAccess: true,
  },
  [B2BTier.VIP]: {
    rpm: 1000, // Effectively unlimited per blueprint description
    creditsPerSignal: 0,
    feePercentage: 0.5,
    hasJitoAccess: true,
  },
};

export class TierService {
  /**
   * Get limits based on user subscription status
   */
  getLimits(status: string): TierLimits {
    const tier = (status as B2BTier) || B2BTier.NONE;
    return TIER_CONFIG[tier] || TIER_CONFIG[B2BTier.NONE];
  }

  /**
   * Calculate institutional fee based on tier
   */
  calculateFee(tier: B2BTier, amount: number): number {
    const limits = this.getLimits(tier);
    return (amount * limits.feePercentage) / 100;
  }
}
