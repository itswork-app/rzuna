export enum UserRank {
  NEWBIE = 'NEWBIE',
  PRO = 'PRO',
  ELITE = 'ELITE',
}

export enum SubscriptionStatus {
  NONE = 'NONE',
  STARLIGHT = 'STARLIGHT',
  STARLIGHT_PLUS = 'STARLIGHT_PLUS',
  VIP = 'VIP',
}

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

export interface TokenSignal {
  id: string;
  score: number;
  aiReasoning?: {
    narrative: string;
    confident: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  event: {
    mint: string;
    signature: string;
    timestamp: string;
    initialLiquidity: number;
    socialScore: number;
    metadata?: {
      name: string;
      symbol: string;
    };
  };
}
