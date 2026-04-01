-- 🏛️ rzuna Database Migration: Treasury Audit Trail Extension (PR 8)
-- Standar: Institutional Grade Asset Tracking

-- 1. Create ENUMs for Treasury Management
DO $$ BEGIN
    CREATE TYPE treasury_asset AS ENUM ('SOL', 'USDC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE treasury_status AS ENUM ('pending_conversion', 'settled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tx_type AS ENUM ('trading_fee', 'subscription');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Alter Transactions table for Treasury tracking
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS type tx_type DEFAULT 'trading_fee',
ADD COLUMN IF NOT EXISTS treasury_asset treasury_asset,
ADD COLUMN IF NOT EXISTS treasury_status treasury_status DEFAULT 'settled';

-- 3. Update RLS policies for Treasury Audit
CREATE POLICY "Treasury can view all transactions" ON public.transactions FOR SELECT USING (true);

-- 4. Indexing for Treasury Analytics
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_treasury_status ON public.transactions(treasury_status);
