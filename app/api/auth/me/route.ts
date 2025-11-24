import { NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function GET() {
  const { user } = await ensureAuthenticated()
  if (!user) {
    return NextResponse.json({ data: null })
  }

  const supabase = getSupabaseAdminClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    data: {
      ...user,
      display_name: profile?.display_name,
      role: profile?.role || user.role,
    },
  })
}
