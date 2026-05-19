import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { changePasswordSchema } from "@/lib/schemas/settings"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = changePasswordSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: errors[0] ?? "Validación fallida", errors }, { status: 422 })
  }

  try {
    const supabase = getSupabaseAdminClient()
    const { newPassword } = result.data

    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: newPassword })
    if (error) {
      console.error("Error al actualizar la contraseña", error)
      return NextResponse.json({ message: "No pudimos actualizar la contraseña" }, { status: 500 })
    }

    return NextResponse.json({ message: "Contraseña actualizada" })
  } catch (error) {
    console.error("Fallo inesperado al cambiar contraseña", error)
    return NextResponse.json({ message: "No pudimos actualizar la contraseña" }, { status: 500 })
  }
}
