import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { productPayloadSchema } from "@/lib/schemas/product"
import { resolveInventoryLocation } from "./location-helpers"

const PRODUCT_SELECT = `
  id, nombre, descripcion, sku, valor_unitario, estado, destacado, categoria_id, metadata,
  categorias:categoria_id ( id, nombre ),
  inventario_items ( id, ubicacion, cantidad, cantidad_minima, estado, bodega_id )
`

const mapProduct = (producto: any) => ({
  ...producto,
  categorias: Array.isArray(producto.categorias) ? producto.categorias[0] ?? null : producto.categorias ?? null,
  inventario_items: producto.inventario_items ?? [],
})

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.trim()
  const categoryId = request.nextUrl.searchParams.get("categoryId")?.trim()
  const supabase = getSupabaseAdminClient()

  let query = supabase.from("prendas").select(PRODUCT_SELECT).order("nombre")
  if (search) {
    query = query.or(`nombre.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (categoryId) {
    query = query.eq("categoria_id", categoryId)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: (data ?? []).map(mapProduct) })
}

export async function POST(request: NextRequest) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = productPayloadSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const {
    nombre,
    sku,
    categoria_id,
    valor_unitario,
    descripcion,
    estado,
    destacado,
    metadata,
    stockInicial,
    stockLocationId,
    ubicacion,
  } = result.data

  const supabase = getSupabaseAdminClient()
  const insertPayload = {
    nombre: nombre.trim(),
    sku: sku ? sku.trim() : null,
    categoria_id: categoria_id || null,
    valor_unitario: typeof valor_unitario === "number" ? valor_unitario : null,
    descripcion: descripcion?.trim() || null,
    estado,
    destacado,
    metadata: metadata && Object.keys(metadata).length > 0 ? metadata : null,
  }

  const { data, error } = await supabase.from("prendas").insert(insertPayload).select().single()
  if (error || !data) {
    return NextResponse.json({ message: error?.message ?? "No se pudo crear el producto" }, { status: 400 })
  }

  if (stockInicial > 0) {
    const targetLocation = await resolveInventoryLocation(supabase, {
      locationId: stockLocationId,
      locationName: ubicacion,
    })

    if (!targetLocation) {
      return NextResponse.json(
        { message: "No pudimos determinar la bodega para el stock inicial" },
        { status: 400 }
      )
    }

    const { error: stockError } = await supabase.from("inventario_items").insert({
      prenda_id: data.id,
      ubicacion: targetLocation.nombre,
      bodega_id: targetLocation.id,
      cantidad: stockInicial,
      cantidad_minima: 0,
      estado: "ok",
    })

    if (stockError) {
      return NextResponse.json({ message: stockError.message }, { status: 400 })
    }
  }

  const { data: refreshed } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", data.id)
    .maybeSingle()

  return NextResponse.json({ data: refreshed ? mapProduct(refreshed) : mapProduct(data) }, { status: 201 })
}
