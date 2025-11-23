import { NextRequest, NextResponse } from "next/server"

import { getAuthenticatedUser } from "@/lib/auth/session"
import { productEventSchema } from "@/lib/schemas/analytics"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null)
  const result = productEventSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { productId, eventType, metadata } = result.data

  const supabase = getSupabaseAdminClient()
  const user = await getAuthenticatedUser()

  const eventData: any = {
    prenda_id: productId,
    event_type: eventType,
    metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
  }

  if (user?.id) {
    eventData.profile_id = user.id
  }

  const { error } = await supabase.from("product_events").insert(eventData)

  if (error) {
    console.error("Error registering event:", error)
    return NextResponse.json({ message: "No pudimos registrar el evento", details: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Evento registrado" })
}
