import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Safe institutional fallback for Vercel build/prerender phases
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ooheonpmgjenriksxwgc.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_nJ74f3Y56MLzwDoa5Zh3qA_tAzCDFMm';

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
