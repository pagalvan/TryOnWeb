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

    // If the error is a Foreign Key violation on profile_id (code 23503), 
    // it means the user exists in Auth but not in the public profiles table.
    // We retry recording the event anonymously.
    if (error.code === '23503' && user?.id) {
      console.warn("Profile FK violation, retrying anonymously")
      delete eventData.profile_id
      const { error: retryError } = await supabase.from("product_events").insert(eventData)
      
      if (!retryError) {
        return NextResponse.json({ message: "Evento registrado (anónimo)" })
      }
    }

    // For analytics, we don't want to break the client if the event fails to save.
    // We log the error on the server but return success to the client.
    return NextResponse.json({ message: "Evento procesado con advertencias", details: error.message }, { status: 200 })
  }

  return NextResponse.json({ message: "Evento registrado" })
}
