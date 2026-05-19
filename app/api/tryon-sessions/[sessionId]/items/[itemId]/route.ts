import { NextRequest, NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"
import { updateTryOnItemSchema } from "@/lib/schemas/tryon"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{
    sessionId: string
    itemId: string
  }>
}

const isValidUuid = (value?: string | null) => Boolean(value && /^[0-9a-fA-F-]{32,}$/.test(value))

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { user, response } = await ensureAuthenticated()
  if (!user) {
    return response
  }

  const { sessionId, itemId } = await context.params

  if (!isValidUuid(sessionId) || !isValidUuid(itemId)) {
    return NextResponse.json({ message: "Identificadores inválidos" }, { status: 400 })
  }

  const supabase = getSupabaseAdminClient()

  try {
    const payload = await request.json().catch(() => null)
    const parsed = updateTryOnItemSchema.safeParse(payload)

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

    const updates: Record<string, unknown> = {}
    if (parsed.data.status) {
      updates.estado = parsed.data.status
    }
    if (parsed.data.durationSeconds !== undefined) {
      updates.duracion_seg = Math.max(0, Math.round(parsed.data.durationSeconds))
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: "Nada por actualizar" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("tryon_items")
      .update(updates)
      .eq("id", itemId)
      .eq("session_id", sessionId)

    if (updateError) {
      console.error("try-on item update failed", updateError)
      return NextResponse.json({ message: "No pudimos actualizar el registro" }, { status: 400 })
    }

    return NextResponse.json({ message: "Item actualizado" })
  } catch (error) {
    console.error("try-on item PATCH failed", error)
    return NextResponse.json({ message: "No pudimos guardar los cambios" }, { status: 500 })
  }
}
