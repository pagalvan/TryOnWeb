import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { productUpdateSchema } from "@/lib/schemas/product"

const PRODUCT_SELECT = `
  id, nombre, descripcion, sku, valor_unitario, estado, destacado, categoria_id, metadata,
  categorias:categoria_id ( id, nombre ),
  inventario_items ( id, ubicacion, cantidad, cantidad_minima, estado )
`

const mapProduct = (producto: any) => ({
  ...producto,
  categorias: Array.isArray(producto.categorias) ? producto.categorias[0] ?? null : producto.categorias ?? null,
  inventario_items: producto.inventario_items ?? [],
})

export const runtime = "nodejs"

type ProductParams = Promise<{ id: string }>

export async function GET(_request: NextRequest, { params }: { params: ProductParams }) {
  const { id } = await params
  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ message: "Producto no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ data: mapProduct(data) })
}

export async function PUT(request: NextRequest, { params }: { params: ProductParams }) {
  const { id } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = productUpdateSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { nombre, sku, categoria_id, valor_unitario, descripcion, estado, destacado, metadata } = result.data
  const supabase = getSupabaseAdminClient()

  const updatePayload: Record<string, any> = {}
  if (nombre !== undefined) updatePayload.nombre = nombre.trim()
  if (sku !== undefined) updatePayload.sku = sku || null
  if (categoria_id !== undefined) updatePayload.categoria_id = categoria_id || null
  if (valor_unitario !== undefined) updatePayload.valor_unitario = valor_unitario
  if (descripcion !== undefined) updatePayload.descripcion = descripcion?.trim() || null
  if (estado !== undefined) updatePayload.estado = estado
  if (destacado !== undefined) updatePayload.destacado = destacado
  if (metadata !== undefined) {
    updatePayload.metadata = metadata && Object.keys(metadata).length > 0 ? metadata : null
  }

  const { error } = await supabase.from("prendas").update(updatePayload).eq("id", id)
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  const { data } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  return NextResponse.json({ data: data ? mapProduct(data) : null })
}

export async function DELETE(_request: NextRequest, { params }: { params: ProductParams }) {
  const { id } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const supabase = getSupabaseAdminClient()
  const { error } = await supabase.from("prendas").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Producto eliminado" })
}
