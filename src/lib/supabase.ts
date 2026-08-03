import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function getSupabaseConfig() {
  return {
    url: supabaseUrl || null,
    hasAnonKey: Boolean(supabaseAnonKey),
    hasServiceRoleKey: Boolean(serviceRoleKey),
  };
}

export function createClientSideSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createServerSupabaseClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createMockSupabaseResponse<T>(data: T) {
  return {
    data,
    error: null,
  } as { data: T; error: null };
}

export const supabase = createClientSideSupabase();
