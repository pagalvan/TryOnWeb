import { NextRequest, NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"
import { closeTryOnSessionSchema } from "@/lib/schemas/tryon"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = {
  params: {
    sessionId: string
  }
}

const isValidUuid = (value?: string | null) => Boolean(value && /^[0-9a-fA-F-]{32,}$/.test(value))

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { user, response } = await ensureAuthenticated()
  if (!user) {
    return response
  }

  const sessionId = context.params?.sessionId
  if (!isValidUuid(sessionId)) {
    return NextResponse.json({ message: "Sesión inválida" }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  try {
    const payload = await request.json().catch(() => null)
    const parsed = closeTryOnSessionSchema.safeParse(payload ?? {})

    if (!parsed.success) {
      const errors = parsed.error.errors.map((issue) => issue.message)
      return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
    }

    const { data: sessionRecord, error: sessionError } = await supabase
      .from("tryon_sessions")
      .select("id, profile_id")
      .eq("id", sessionId)
      .maybeSingle()

    if (sessionError) {
      console.error("try-on session lookup failed", sessionError)
      return NextResponse.json({ message: "No pudimos validar la sesión" }, { status: 500 })
    }

    if (!sessionRecord) {
      return NextResponse.json({ message: "Sesión no encontrada" }, { status: 404 })
    }

    if (sessionRecord.profile_id !== user.id && user.role !== "admin") {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 })
    }

    const endedAt = parsed.data.endedAt ? new Date(parsed.data.endedAt).toISOString() : new Date().toISOString()

    const { error: sessionUpdateError } = await supabase
      .from("tryon_sessions")
      .update({ ended_at: endedAt })
      .eq("id", sessionId)

    if (sessionUpdateError) {
      console.error("try-on session close failed", sessionUpdateError)
      return NextResponse.json({ message: "No pudimos cerrar la sesión" }, { status: 400 })
    }

    if (parsed.data.lastItem) {
      const { itemId, status, durationSeconds } = parsed.data.lastItem
      const updates: Record<string, unknown> = {}

      if (status) {
        updates.estado = status
      }

      if (durationSeconds !== undefined) {
        updates.duracion_seg = Math.max(0, Math.round(durationSeconds))
      }

      if (Object.keys(updates).length > 0) {
        const { error: itemUpdateError } = await supabase
          .from("tryon_items")
          .update(updates)
          .eq("id", itemId)
          .eq("session_id", sessionId)

        if (itemUpdateError) {
          console.error("try-on last item update failed", itemUpdateError)
          return NextResponse.json({ message: "Sesión cerrada, pero no pudimos actualizar el item" }, { status: 400 })
        }
      }
    }

    return NextResponse.json({ message: "Sesión cerrada" })
  } catch (error) {
    console.error("try-on session PATCH failed", error)
    return NextResponse.json({ message: "No pudimos cerrar la experiencia" }, { status: 500 })
  }
}
