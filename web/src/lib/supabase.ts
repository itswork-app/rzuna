import { createClient } from '@supabase/supabase-js';

// Safe institutional fallback for Vercel build/prerender phases
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ooheonpmgjenriksxwgc.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
