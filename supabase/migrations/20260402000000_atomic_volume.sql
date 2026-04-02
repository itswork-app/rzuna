-- 🏛️ RZUNA Institutional Hardening: Atomic Volume Engine
-- Standar: Canonical Master Blueprint v1.6

CREATE OR REPLACE FUNCTION public.add_volume_atomic(
    p_wallet_address TEXT,
    p_volume_increment NUMERIC,
    p_fee_increment NUMERIC
)
RETURNS user_rank AS $$
DECLARE
    new_volume NUMERIC;
    new_fees NUMERIC;
    new_rank user_rank;
    pro_threshold NUMERIC := 1000;
    elite_threshold NUMERIC := 10000;
BEGIN
    -- Perform atomic update and capture new values
    UPDATE public.profiles
    SET 
        current_month_volume = current_month_volume + p_volume_increment,
        total_fees_paid = total_fees_paid + p_fee_increment,
        updated_at = NOW()
    WHERE wallet_address = p_wallet_address
    RETURNING current_month_volume, total_fees_paid INTO new_volume, new_fees;

    -- If profile doesn't exist, create it (Upsert logic)
    IF NOT FOUND THEN
        new_volume := p_volume_increment;
        new_fees := p_fee_increment;
        
        -- Determine initial rank
        IF new_volume >= elite_threshold THEN
            new_rank := 'ELITE';
        ELSIF new_volume >= pro_threshold THEN
            new_rank := 'PRO';
        ELSE
            new_rank := 'NEWBIE';
        END IF;

        INSERT INTO public.profiles (wallet_address, current_month_volume, total_fees_paid, rank)
        VALUES (p_wallet_address, new_volume, new_fees, new_rank);
        
        RETURN new_rank;
    END IF;

    -- Determine new rank based on updated volume
    IF new_volume >= elite_threshold THEN
        new_rank := 'ELITE';
    ELSIF new_volume >= pro_threshold THEN
        new_rank := 'PRO';
    ELSE
        new_rank := 'NEWBIE';
    END IF;

    -- Update rank if it changed
    UPDATE public.profiles
    SET rank = new_rank
    WHERE wallet_address = p_wallet_address;

    RETURN new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
