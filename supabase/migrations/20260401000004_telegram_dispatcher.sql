-- PR 12: Telegram Alpha Dispatcher Schema Update
-- Adds Telegram Chat ID and Enable/Disable toggle for premium users.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tg_chat_id TEXT,
ADD COLUMN IF NOT EXISTS is_tg_enabled BOOLEAN DEFAULT FALSE;

-- Ensure correct indexing for fast lookups during signal broadcast
CREATE INDEX IF NOT EXISTS idx_profiles_tg_enabled ON public.profiles (is_tg_enabled) WHERE is_tg_enabled = TRUE;
