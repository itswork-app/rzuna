import { createClient } from '@supabase/supabase-js';
import { env } from '../../utils/env.js';

/**
 * Institutional Grade Supabase Type Definitions
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          wallet_address: string;
          rank: string;
          subscription_status: string;
          current_month_volume: number;
          total_fees_paid: number;
          last_rank_reset: string;
          is_banned: boolean;
          created_at: string;
          updated_at: string;
          ai_quota_limit: number;
          ai_quota_used: number;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          rank?: string;
          subscription_status?: string;
          current_month_volume?: number;
          total_fees_paid?: number;
          last_rank_reset?: string;
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
          ai_quota_limit?: number;
          ai_quota_used?: number;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          rank?: string;
          subscription_status?: string;
          current_month_volume?: number;
          total_fees_paid?: number;
          last_rank_reset?: string;
          is_banned?: boolean;
          created_at?: string;
          updated_at?: string;
          ai_quota_limit?: number;
          ai_quota_used?: number;
        };
      };
      scouted_tokens: {
        Row: {
          id: string;
          mint_address: string;
          symbol: string;
          base_score: number;
          ai_reasoning: string;
          is_active: boolean;
          is_private: boolean;
          metadata: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          mint_address: string;
          symbol: string;
          base_score?: number;
          ai_reasoning?: string;
          is_active?: boolean;
          is_private?: boolean;
          metadata?: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          mint_address?: string;
          symbol?: string;
          base_score?: number;
          ai_reasoning?: string;
          is_active?: boolean;
          is_private?: boolean;
          metadata?: unknown;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          tx_hash: string;
          amount_usd: number;
          fee_collected: number;
          status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tx_hash: string;
          amount_usd: number;
          fee_collected: number;
          status?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tx_hash?: string;
          amount_usd?: number;
          fee_collected?: number;
          status?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/**
 * Institutional Grade Supabase Client
 */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_KEY);
