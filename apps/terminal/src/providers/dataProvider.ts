import { dataProvider as supabaseDataProvider } from '@refinedev/supabase';
import { supabase } from '@/lib/supabase';

export const dataProvider = supabaseDataProvider(supabase);

/**
 * Institutional Data Refinery
 * Specialized for RZUNA High-Frequency Signals
 */
export const rzunaDataProvider = {
  ...dataProvider,
  // Custom overrides for institutional logic (e.g. signal normalization) can go here
};
