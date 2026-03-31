export type UserRank = 'NEWBIE' | 'PRO' | 'ELITE';
export type SubscriptionStatus = 'NONE' | 'STARLIGHT' | 'STARLIGHT_PLUS' | 'VIP';

export interface UserProfile {
  walletAddress: string;
  rank: UserRank;
  status: SubscriptionStatus;
  aiQuotaLimit: number;
  aiQuotaUsed: number;
  volume: {
    currentMonthVolume: number;
    totalFeesPaid: number;
  };
}

export interface AlphaSignal {
  mint: string;
  symbol: string;
  score: number;
  isPremium: boolean;
  isNew: boolean;
  timestamp: number;
  reasoning?: {
    narrative: string;
    riskFactors: string[];
    catalysts: string[];
  };
  aiReasoning?: {
    narrative: string;
    riskFactors: string[];
    catalysts: string[];
    generatedByAI: boolean;
  };
}
