import { createClient, SupabaseClient } from "@supabase/supabase-js"

import { serverEnv } from "@/lib/env.server"

let supabaseInstance: SupabaseClient | null = null

export const getSupabaseAdminClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return supabaseInstance
}
