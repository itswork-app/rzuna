-- 🏛️ rzuna Database Schema v1.3: Institutional-Grade Polish
-- Standar: World-Class Web3 Foundation

-- 1. ENUMS (Type-Safe at DB level)
DO $$ BEGIN
    CREATE TYPE user_rank AS ENUM ('NEWBIE', 'PRO', 'ELITE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_status AS ENUM ('NONE', 'STARLIGHT', 'STARLIGHT_PLUS', 'VIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. TABLE: PROFILES (Wallet-as-Identity)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address TEXT UNIQUE NOT NULL, -- Identitas utama Web3
    rank user_rank DEFAULT 'NEWBIE',
    subscription_status sub_status DEFAULT 'NONE',
    
    -- Volume & Revenue Tracking
    current_month_volume NUMERIC(20, 8) DEFAULT 0, -- Dalam SOL/USD
    total_fees_paid NUMERIC(20, 8) DEFAULT 0,
    last_rank_reset TIMESTAMPTZ DEFAULT NOW(),
    
    -- Governance & Security
    is_banned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE: SCOUTED_TOKENS (Auto-Down & Scoring Engine)
CREATE TABLE IF NOT EXISTS public.scouted_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mint_address TEXT UNIQUE NOT NULL,
    symbol TEXT,
    base_score INTEGER CHECK (base_score >= 0 AND base_score <= 100),
    ai_reasoning TEXT, -- Diisi oleh Eliza OS untuk VIP
    
    -- Auto-Down Logic
    is_active BOOLEAN DEFAULT TRUE, -- Polisi "Auto-Down" mengubah ini jadi FALSE
    is_private BOOLEAN DEFAULT FALSE, -- TRUE jika skor 90+ (Scarcity Engine)
    
    metadata JSONB, -- Data mentah dari gRPC Geyser
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE: TRANSACTIONS (Audit Trail & Volume Calc)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    tx_hash TEXT UNIQUE NOT NULL,
    amount_usd NUMERIC(20, 8),
    fee_collected NUMERIC(20, 8),
    status TEXT, -- 'success', 'failed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INDEXING (Performance Optimization)
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_tokens_active_score ON public.scouted_tokens(is_active, base_score);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);

-- 6. Row Level Security (RLS) - Basic Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scouted_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Allow public read for profiles (Public Dashboard)
CREATE POLICY "Public Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Tokens are viewable by everyone" ON public.scouted_tokens FOR SELECT USING (true);
