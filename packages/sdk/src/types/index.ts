export interface AivoConfig {
  apiKey: string;
  baseUrl: string;
  wssUrl: string;
}

export interface SignalEvent {
  mint: string;
  symbol: string;
  name: string;
  score: number;
  isPremium: boolean;
  aiReasoning?: {
    narrative: string;
    confidence: number;
  };
  socials?: {
    twitter?: string;
    telegram?: string;
  };
}

export interface SwapParams {
  mint: string;
  amount: string;
  type: 'buy' | 'sell';
  slippageBps?: number;
  priorityFee?: number;
}

export interface UsageStatus {
  userId: string;
  creditsRemaining: number;
  resetAt: string;
  tier: string;
}
