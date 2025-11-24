import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin, getAuthenticatedUser } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import { productPayloadSchema } from "@/lib/schemas/product"
import { resolveInventoryLocation } from "./location-helpers"
import { syncLensAsset } from "./lens-helpers"

const PRODUCT_SELECT = `
  id, nombre, descripcion, sku, valor_unitario, estado, destacado, categoria_id, metadata, talla, color,
  categorias:categoria_id ( id, nombre ),
  inventario_items ( id, ubicacion, cantidad, cantidad_minima, estado, bodega_id ),
  lens_assets ( id, prenda_id, tipo, url, provider, version, metadata, activo, created_at, updated_at )
`

const mapProduct = (producto: any) => ({
  ...producto,
  categorias: Array.isArray(producto.categorias) ? producto.categorias[0] ?? null : producto.categorias ?? null,
  inventario_items: producto.inventario_items ?? [],
  lens_assets: Array.isArray(producto.lens_assets) ? producto.lens_assets : [],
  tallas: producto.talla ? producto.talla.split(",").map((t: string) => t.trim()) : [],
  colores: producto.color ? producto.color.split(",").map((c: string) => c.trim()) : [],
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

  let products = (data ?? []).map(mapProduct)

  // Personalization Logic: Boost products based on user favorites
  const user = await getAuthenticatedUser()
  if (user) {
    try {
      // Fetch user's favorite products to identify preferred categories
      const { data: favorites } = await supabase
        .from("product_favorites")
        .select("prenda_id, prendas(categoria_id)")
        .eq("profile_id", user.id)

      if (favorites && favorites.length > 0) {
        // Extract unique category IDs from favorites
        const favoriteCategoryIds = [...new Set(
          favorites
            .map((f: any) => f.prendas?.categoria_id)
            .filter(Boolean)
        )] as string[]

        if (favoriteCategoryIds.length > 0) {
          // Sort products:
          // 1. Same Category & Featured (Destacado)
          // 2. Same Category
          // 3. Featured (General)
          // 4. Others
          products.sort((a, b) => {
            const aInFav = favoriteCategoryIds.includes(a.categoria_id)
            const bInFav = favoriteCategoryIds.includes(b.categoria_id)

            // Priority 1 & 2 vs Others
            if (aInFav && !bInFav) return -1
            if (!aInFav && bInFav) return 1

            // Within same group (both fav or both not fav), prioritize Featured
            if (a.destacado && !b.destacado) return -1
            if (!a.destacado && b.destacado) return 1

            return 0 // Keep original order (alphabetical by name)
          })
        }
      }
    } catch (err) {
      console.error("Error applying personalization:", err)
      // Continue with unsorted products if personalization fails
    }
  }

  return NextResponse.json({ data: products })
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
    tallas,
    colores,
    stockInicial,
    stockLocationId,
    ubicacion,
    lensAsset,
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
    talla: tallas && tallas.length > 0 ? tallas.join(", ") : null,
    color: colores && colores.length > 0 ? colores.join(", ") : null,
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

    const { data: stockItem, error: stockError } = await supabase
      .from("inventario_items")
      .insert({
        prenda_id: data.id,
        ubicacion: targetLocation.nombre,
        bodega_id: targetLocation.id,
        cantidad: stockInicial,
        cantidad_minima: 0,
        estado: "ok",
      })
      .select("id")
      .single()

    if (stockError) {
      return NextResponse.json({ message: stockError.message }, { status: 400 })
    }

    // Record initial movement
    if (stockItem) {
      await supabase.from("inventario_movimientos").insert({
        inventario_id: stockItem.id,
        tipo: "entrada",
        cantidad: stockInicial,
        motivo: "Stock inicial (Creación de producto)",
      })
    }
  }

  const { error: lensAssetError } = await syncLensAsset(supabase, data.id, lensAsset ?? null)
  if (lensAssetError) {
    await supabase.from("prendas").delete().eq("id", data.id)
    return NextResponse.json({ message: lensAssetError.message ?? "No pudimos asociar el Lens" }, { status: 400 })
  }

  const { data: refreshed } = await supabase
    .from("prendas")
    .select(PRODUCT_SELECT)
    .eq("id", data.id)
    .maybeSingle()

  return NextResponse.json({ data: refreshed ? mapProduct(refreshed) : mapProduct(data) }, { status: 201 })
}
