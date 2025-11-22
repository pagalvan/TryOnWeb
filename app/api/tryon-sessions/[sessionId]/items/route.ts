import { NextRequest, NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"
import { appendTryOnItemSchema } from "@/lib/schemas/tryon"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type RouteContext = {
  params: {
    sessionId: string
  }
}

const isValidUuid = (value?: string | null) => Boolean(value && /^[0-9a-fA-F-]{32,}$/.test(value))

export async function POST(request: NextRequest, context: RouteContext) {
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
    const parsed = appendTryOnItemSchema.safeParse(payload)

    if (!parsed.success) {
      const errors = parsed.error.errors.map((issue) => issue.message)
      return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
    }

    const { productId, lensAssetId } = parsed.data

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
      return NextResponse.json({ message: "No autorizado para modificar esta sesión" }, { status: 403 })
    }

    const { data: existingItem } = await supabase
      .from("tryon_items")
      .select("id")
      .eq("session_id", sessionId)
      .eq("prenda_id", productId)
      .maybeSingle()

    let itemId: string | null = existingItem?.id ?? null

    if (itemId) {
      const { error: updateError } = await supabase
        .from("tryon_items")
        .update({
          lens_asset_id: lensAssetId ?? null,
          estado: "pendiente",
          duracion_seg: 0,
          feedback: null,
          created_at: new Date().toISOString(),
        })
        .eq("id", itemId)

      if (updateError) {
        console.error("try-on item update failed", updateError)
        return NextResponse.json({ message: "No pudimos actualizar el producto seleccionado" }, { status: 400 })
      }
    } else {
      const { data: itemData, error: itemError } = await supabase
        .from("tryon_items")
        .insert({
          session_id: sessionId,
          prenda_id: productId,
          lens_asset_id: lensAssetId ?? null,
          estado: "pendiente",
          duracion_seg: 0,
        })
        .select("id")
        .single()

      if (itemError || !itemData) {
        console.error("try-on item insert failed", itemError)
        return NextResponse.json({ message: "No pudimos registrar el producto seleccionado" }, { status: 400 })
      }

      itemId = itemData.id as string
    }

    const eventMetadata: Record<string, unknown> = {
      sessionId,
      source: "probador-virtual",
    }
    if (lensAssetId) {
      eventMetadata.lensAssetId = lensAssetId
    }

    const { error: eventError } = await supabase.from("product_events").insert({
      profile_id: sessionRecord.profile_id,
      prenda_id: productId,
      event_type: "tryon",
      metadata: eventMetadata,
    })

    if (eventError) {
      console.warn("try-on item event insert failed", eventError)
    }

    return NextResponse.json({ itemId })
  } catch (error) {
    console.error("try-on item POST failed", error)
    return NextResponse.json({ message: "No pudimos actualizar la sesión" }, { status: 500 })
  }
}
