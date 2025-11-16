import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { categoryUpdateSchema } from "@/lib/schemas/category"

const CATEGORY_SELECT = `
  id,
  nombre,
  descripcion,
  estado,
  icon,
  prendas:prendas ( id )
`

type CategoryRecord = {
  id: string
  nombre: string
  descripcion: string | null
  estado: string
  icon: string | null
  prendas?: Array<{ id: string }>
}

const mapCategory = (category: CategoryRecord) => ({
  id: category.id,
  nombre: category.nombre,
  descripcion: category.descripcion,
  estado: category.estado,
  icon: category.icon,
  productCount: Array.isArray(category.prendas) ? category.prendas.length : 0,
})

export const runtime = "nodejs"

type ParamsPromise = Promise<{ id: string; stockId?: string }>

export async function GET(_request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("categorias")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ message: "Categoría no encontrada" }, { status: 404 })
  }

  return NextResponse.json({ data: mapCategory(data) })
}

export async function PUT(request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = categoryUpdateSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { nombre, descripcion, estado, icon } = result.data
  const updatePayload: Record<string, unknown> = {}

  if (nombre !== undefined) updatePayload.nombre = nombre.trim()
  if (descripcion !== undefined) updatePayload.descripcion = descripcion?.trim() || null
  if (estado !== undefined) updatePayload.estado = estado
  if (icon !== undefined) updatePayload.icon = icon?.trim() || null

  const supabase = getSupabaseAdminClient()

  const { error } = await supabase.from("categorias").update(updatePayload).eq("id", id)
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  const { data, error: fetchError } = await supabase
    .from("categorias")
    .select(CATEGORY_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ message: fetchError.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ data: null }, { status: 200 })
  }

  return NextResponse.json({ data: mapCategory(data) })
}

export async function DELETE(_request: NextRequest, { params }: { params: ParamsPromise }) {
  const { id } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("categorias").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Categoría eliminada" })
}
