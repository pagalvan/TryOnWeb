import { createClient } from "@supabase/supabase-js"

import { serverEnv } from "@/lib/env.server"

const supabase = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const getSupabaseAdminClient = () => supabase
