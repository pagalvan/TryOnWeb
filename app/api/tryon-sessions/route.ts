import { NextRequest, NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"
import { startTryOnSessionSchema } from "@/lib/schemas/tryon"
import { createClient } from "@supabase/supabase-js"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { serverEnv } from "@/lib/env.server"

export const runtime = "nodejs"

const normalizeText = (value?: string | null, limit = 160) => {
  const trimmed = value?.trim()
  if (!trimmed) return null
  return trimmed.length > limit ? trimmed.slice(0, limit) : trimmed
}

export async function POST(request: NextRequest) {
  const { user, response } = await ensureAuthenticated()
  if (!user) {
    return response
  }

  // Explicitly create admin client to ensure service role is used
  const supabase = createClient(serverEnv.supabaseUrl, serverEnv.supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const isServiceKey = serverEnv.supabaseServiceKey.startsWith("eyJ") // JWT usually starts with eyJ
  const isAnonKey = serverEnv.supabaseAnonKey === serverEnv.supabaseServiceKey
  console.log("Using Service Key:", isServiceKey, "Is Same as Anon:", isAnonKey)

  try {
    const payload = await request.json().catch(() => null)
    console.log("TryOn Session Payload:", JSON.stringify(payload, null, 2))
    const parsed = startTryOnSessionSchema.safeParse(payload)

    if (!parsed.success) {
      const errors = parsed.error.errors.map((issue) => issue.message)
      return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
    }

    const { productId, lensAssetId, device, platform, origin } = parsed.data

    const { data: sessionData, error: sessionError } = await supabase
      .from("tryon_sessions")
      .insert({
        profile_id: user.id,
        dispositivo: normalizeText(device),
        plataforma: normalizeText(platform, 80),
        origen: normalizeText(origin, 80) ?? "probador-virtual",
        metadata: {
          source: "probador-virtual",
          initialProductId: productId,
          lensAssetId: lensAssetId ?? null,
        },
      })
      .select("id")
      .single()

    if (sessionError || !sessionData) {
      console.error("create try-on session failed", sessionError)
      return NextResponse.json({ message: "No pudimos iniciar la sesión de try-on" }, { status: 400 })
    }

    const sessionId = sessionData.id as string

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
      console.error("create try-on item failed", itemError)
      await supabase.from("tryon_sessions").delete().eq("id", sessionId)
      return NextResponse.json({ message: "No pudimos registrar el producto en la sesión" }, { status: 400 })
    }

    const itemId = itemData.id as string

    const eventMetadata: Record<string, unknown> = {
      sessionId,
      source: "probador-virtual",
    }
    if (lensAssetId) {
      eventMetadata.lensAssetId = lensAssetId
    }

    const { error: eventError } = await supabase.from("product_events").insert({
      profile_id: user.id,
      prenda_id: productId,
      event_type: "tryon",
      metadata: Object.keys(eventMetadata).length > 0 ? eventMetadata : null,
    })

    if (eventError) {
      console.warn("try-on event insert failed", eventError)
    }

    return NextResponse.json({ sessionId, itemId })
  } catch (error) {
    console.error("try-on session POST failed", error)
    return NextResponse.json({ message: "No pudimos iniciar la experiencia" }, { status: 500 })
  }
}
