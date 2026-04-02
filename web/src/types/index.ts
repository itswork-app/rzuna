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
  id: string;
  wallet_address: string;
  rank: UserRank;
  rank_level: number;
  subscription_status: SubscriptionStatus;
  ai_quota_limit: number;
  ai_quota_used: number;
  total_volume_usd: number;
  current_month_volume: number;
  last_rank_reset: string;
  tg_chat_id?: string;
  is_tg_enabled?: boolean;
  quota?: number;
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
