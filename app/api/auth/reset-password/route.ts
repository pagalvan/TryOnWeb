import { NextResponse } from "next/server"

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { resetPasswordSchema } from "@/lib/schemas/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = resetPasswordSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { accessToken, password } = result.data
  const supabase = getSupabaseAdminClient()

  const { data: userData, error: tokenError } = await supabase.auth.getUser(accessToken)
  if (tokenError || !userData.user) {
    return NextResponse.json({ message: "Token inválido o expirado" }, { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(userData.user.id, { password })
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Contraseña actualizada" })
}
