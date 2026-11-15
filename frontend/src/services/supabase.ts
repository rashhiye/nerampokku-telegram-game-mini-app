// ==============================================================================
// SUPABASE CLIENT SERVICE
// File: frontend/src/services/supabase.ts
// ==============================================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://jhriqnxtokxldzxdoqry.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_jYtT0x2q7XrwI5L7g2kKbA_qHMNchlA";

export const isSupabaseConfigured = () => {
  return true;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
