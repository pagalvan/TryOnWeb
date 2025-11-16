import { NextResponse } from "next/server"

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { registerSchema } from "@/lib/schemas/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = registerSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { email, password, nombre, telefono } = result.data
  const supabase = getSupabaseAdminClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, telefono },
    },
  })

  if (error || !data.user) {
    return NextResponse.json({ message: error?.message ?? "No se pudo crear la cuenta" }, { status: 400 })
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    display_name: nombre,
    phone: telefono,
    role: "cliente",
  })

  return NextResponse.json(
    { message: "Registro exitoso, revisa tu correo para confirmar la cuenta" },
    { status: 201 }
  )
}
