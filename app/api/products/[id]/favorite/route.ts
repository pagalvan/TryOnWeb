import { NextRequest, NextResponse } from "next/server"

import { ensureAuthenticated, getAuthenticatedUser } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type ProductParams = Promise<{ id: string }>

export async function GET(_request: NextRequest, { params }: { params: ProductParams }) {
  const { id } = await params
  const user = await getAuthenticatedUser()

  if (!user) {
    return NextResponse.json({ favorited: false })
  }

  const supabase = getSupabaseAdminClient()
  const { data, error } = await supabase
    .from("product_favorites")
    .select("id")
    .eq("profile_id", user.id)
    .eq("prenda_id", id)
    .maybeSingle()

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ message: "No pudimos consultar el favorito" }, { status: 400 })
  }

  return NextResponse.json({ favorited: Boolean(data) })
}

export async function POST(_request: NextRequest, { params }: { params: ProductParams }) {
  const auth = await ensureAuthenticated()
  if (!auth.user) {
    return auth.response
  }

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const existing = await supabase
    .from("product_favorites")
    .select("id")
    .eq("profile_id", auth.user.id)
    .eq("prenda_id", id)
    .maybeSingle()

  if (existing.error && existing.error.code !== "PGRST116") {
    return NextResponse.json({ message: "No pudimos verificar el favorito" }, { status: 400 })
  }

  if (existing.data) {
    return NextResponse.json({ favorited: true })
  }

  const insert = await supabase
    .from("product_favorites")
    .insert({ profile_id: auth.user.id, prenda_id: id })

  if (insert.error) {
    return NextResponse.json({ message: "No pudimos guardar el favorito" }, { status: 400 })
  }

  await supabase
    .from("product_events")
    .insert({
      prenda_id: id,
      event_type: "favorite",
      profile_id: auth.user.id,
      metadata: { source: "product-detail" },
    })

  return NextResponse.json({ favorited: true })
}

export async function DELETE(_request: NextRequest, { params }: { params: ProductParams }) {
  const auth = await ensureAuthenticated()
  if (!auth.user) {
    return auth.response
  }

  const { id } = await params
  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("product_favorites")
    .delete()
    .eq("profile_id", auth.user.id)
    .eq("prenda_id", id)

  if (error) {
    return NextResponse.json({ message: "No pudimos quitar el favorito" }, { status: 400 })
  }

  return NextResponse.json({ favorited: false })
}
