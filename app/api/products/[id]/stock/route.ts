import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { stockSchema } from "@/lib/schemas/product"
import { resolveInventoryLocation } from "../../location-helpers"

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

type StockParams = Promise<{ id: string }>

export async function PUT(request: NextRequest, { params }: { params: StockParams }) {
  const { id } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = stockSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: "Validación fallida", errors }, { status: 422 })
  }

  const { itemId, bodegaId, ubicacion, cantidad, cantidad_minima, estado } = result.data
  const supabase = getSupabaseAdminClient()

  const targetLocation = await resolveInventoryLocation(supabase, {
    locationId: bodegaId,
    locationName: ubicacion,
  })

  if (!targetLocation) {
    return NextResponse.json({ message: "Selecciona una bodega válida" }, { status: 400 })
  }

  const record = {
    prenda_id: id,
    ubicacion: targetLocation.nombre,
    bodega_id: targetLocation.id,
    cantidad,
    cantidad_minima,
    estado,
  }

  if (itemId) {
    const { error } = await supabase.from("inventario_items").update(record).eq("id", itemId)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
  } else {
    const { error } = await supabase.from("inventario_items").insert(record)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
  }

  const { data } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  return NextResponse.json({ data: data ? mapProduct(data) : null })
}
