import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Next.js API Routes Only: Bypasses RLS utilizing the server-side Service Role key
export function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Database mutations will fail.");
  }
  return createClient(supabaseUrl, serviceKey || '');
}
