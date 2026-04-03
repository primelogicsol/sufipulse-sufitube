import { createClient, SupabaseClient } from '@supabase/supabase-js';

const cleanEnv = (value: string | undefined): string => {
  if (!value) return '';
  const normalized = value.trim();
  if (normalized === '' || normalized.toLowerCase() === 'undefined' || normalized.toLowerCase() === 'null') {
    return '';
  }
  return normalized;
};

const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not defined or invalid. Running in standalone mode.');
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;
