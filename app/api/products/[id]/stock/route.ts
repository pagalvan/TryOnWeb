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
    // 1. Fetch previous quantity to calculate difference
    const { data: oldItem } = await supabase
      .from("inventario_items")
      .select("cantidad")
      .eq("id", itemId)
      .single()

    const oldQuantity = oldItem?.cantidad ?? 0
    const diff = cantidad - oldQuantity

    const { error } = await supabase.from("inventario_items").update(record).eq("id", itemId)
    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // 2. Record movement if quantity changed
    if (diff !== 0) {
      await supabase.from("inventario_movimientos").insert({
        inventario_id: itemId,
        tipo: diff > 0 ? "entrada" : "salida",
        cantidad: Math.abs(diff),
        motivo: "Actualización manual de stock",
      })
    }
  } else {
    const { data: newItem, error } = await supabase
      .from("inventario_items")
      .insert(record)
      .select("id")
      .single()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // 3. Record initial movement
    if (cantidad > 0) {
      await supabase.from("inventario_movimientos").insert({
        inventario_id: newItem.id,
        tipo: "entrada",
        cantidad: cantidad,
        motivo: "Stock inicial",
      })
    }
  }

  const { data } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  return NextResponse.json({ data: data ? mapProduct(data) : null })
}
