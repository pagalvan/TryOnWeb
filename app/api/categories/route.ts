import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { categoryCreateSchema } from "@/lib/schemas/category"

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

export async function GET() {
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase.from("categorias").select(CATEGORY_SELECT).order("nombre")

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: (data ?? []).map(mapCategory) })
}

export async function POST(request: Request) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = categoryCreateSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { nombre, descripcion, estado, icon } = result.data
  const supabase = getSupabaseAdminClient()
  const insertPayload = {
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    estado,
    icon: icon?.trim() || null,
  }

  const { data, error } = await supabase.from("categorias").insert(insertPayload).select(CATEGORY_SELECT).single()

  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "No se pudo crear la categoría" }, { status: 400 })
  }

  return NextResponse.json({ data: mapCategory(data) }, { status: 201 })
}
