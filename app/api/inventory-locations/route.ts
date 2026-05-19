import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

const locationPayloadSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  descripcion: z.string().optional().or(z.literal("")).nullable(),
  direccion: z.string().optional().or(z.literal("")).nullable(),
  ciudad: z.string().optional().or(z.literal("")).nullable(),
})

const trimOrNull = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export const runtime = "nodejs"

export async function GET() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("inventario_bodegas")
    .select("id, nombre, descripcion, direccion, ciudad")
    .order("nombre")

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = locationPayloadSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const supabase = getSupabaseAdminClient()

  const record = {
    nombre: result.data.nombre.trim(),
    descripcion: trimOrNull(result.data.descripcion),
    direccion: trimOrNull(result.data.direccion),
    ciudad: trimOrNull(result.data.ciudad),
  }

  let insertResponse = await supabase
    .from("inventario_bodegas")
    .insert(record)
    .select("id, nombre, descripcion, direccion, ciudad")
    .single()

  if (insertResponse.error && insertResponse.error.code === "23505") {
    const { data } = await supabase
      .from("inventario_bodegas")
      .select("id, nombre, descripcion, direccion, ciudad")
      .ilike("nombre", record.nombre)
      .maybeSingle()

    if (data) {
      return NextResponse.json({ data }, { status: 200 })
    }
  }

  if (insertResponse.error) {
    return NextResponse.json({ message: insertResponse.error.message }, { status: 400 })
  }

  return NextResponse.json({ data: insertResponse.data }, { status: 201 })
}
