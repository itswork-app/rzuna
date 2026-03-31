-- Migration: Add AI Quota to Profiles (PR 5/6)
-- As defined in Canonical Blueprint v1.5

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ai_quota_limit INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_quota_used INTEGER DEFAULT 0;

-- Update Default Quota based on Subscription Status
UPDATE public.profiles SET ai_quota_limit = 20 WHERE subscription_status = 'STARLIGHT';
UPDATE public.profiles SET ai_quota_limit = 100 WHERE subscription_status = 'STARLIGHT_PLUS';
UPDATE public.profiles SET ai_quota_limit = 5000 WHERE subscription_status = 'VIP';

-- Create RPC for atomic increment to prevent race conditions
CREATE OR REPLACE FUNCTION increment_ai_usage(wallet text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.profiles
  SET ai_quota_used = ai_quota_used + 1, updated_at = NOW()
  WHERE wallet_address = wallet;
$$;
