/**
 * rzuna - User Domain Types
 * Standar: Canonical Master Blueprint v1.3
 * Status: WORLD-CLASS MODULAR
 */

export enum UserRank {
  NEWBIE = 'NEWBIE', // Starting point
  PRO = 'PRO', // Level 1 Grinder
  ELITE = 'ELITE', // Top Tier Grinder
}

export enum SubscriptionStatus {
  NONE = 'NONE',
  STARLIGHT = 'STARLIGHT',
  STARLIGHT_PLUS = 'STARLIGHT_PLUS',
  VIP = 'VIP', // Dedicated Infrastructure Access
}

export interface UserVolume {
  currentMonthVolume: number; // Dalam USD/SOL untuk penentuan Rank
  totalFeesPaid: number; // Revenue yang dihasilkan user buat rzuna
  lastResetDate: Date; // Untuk logika "Monthly Reset" ala ML
}

export interface UserProfile {
  id?: string; // UUID from Supabase
  walletAddress: string; // Identity (Primary Key)
  rank: UserRank; // ML-style Rank
  status: SubscriptionStatus; // Paid Pass status
  volume: UserVolume; // Data grinding user

  // Metadata untuk Observability (PostHog/Axiom)
  createdAt: Date;
  lastActiveAt: Date;
  isBanned: boolean; // Guardian Police feature
  aiQuotaLimit: number; // Tier-based limit
  aiQuotaUsed: number; // Usage tracker
}

/**
 * Utility untuk menentukan probabilitas kemunculan token 90+
 * berdasarkan Rank/Status (PR 5 Logic)
 */
export type UserTierAccess = {
  hasPrivateTokenAccess: boolean; // Starlight+ & VIP
  hasAiReasoning: boolean; // STARLIGHT+ & VIP
  aiReasoningQuota: number; // Remaining quota for current session
  priorityLevel: number; // 1 (Low) - 10 (Dedicated VIP)
};
