import { NextResponse } from "next/server"

import { signSessionToken } from "@/lib/auth/jwt"
import { setSessionCookie } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { loginSchema } from "@/lib/schemas/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  const result = loginSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  try {
    const { email, password } = result.data
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      console.error("Supabase login error", error)
      return NextResponse.json({ message: "Credenciales inválidas" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, display_name, phone")
      .eq("id", data.user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Supabase profile fetch error", profileError)
    }

    const role = profile?.role ?? "cliente"
    const token = signSessionToken({
      id: data.user.id,
      email: data.user.email ?? email,
      role,
    })

    const response = NextResponse.json({
      data: {
        id: data.user.id,
        email: data.user.email ?? email,
        role,
        nombre: profile?.display_name ?? (data.user.user_metadata as any)?.nombre ?? "",
        telefono: profile?.phone ?? (data.user.user_metadata as any)?.telefono ?? "",
        token, // Return token for client-side session management
      },
    })

    setSessionCookie(response, token)
    return response
  } catch (error) {
    console.error("Unexpected login failure", error)
    return NextResponse.json(
      { message: "No pudimos conectar con el servicio de autenticación" },
      { status: 503 }
    )
  }
}
