import { NextResponse } from "next/server"

import { serverEnv } from "@/lib/env.server"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { forgotPasswordSchema } from "@/lib/schemas/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = forgotPasswordSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { email } = result.data
  const supabase = getSupabaseAdminClient()

  const redirectTo = new URL("/reset-password", serverEnv.siteUrl).toString()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Enviamos un correo con las instrucciones" })
}
