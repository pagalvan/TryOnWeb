import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getSupabaseAdminClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

type StockDetailParams = Promise<{ id: string; stockId: string }>

export async function DELETE(
  _request: Request,
  { params }: { params: StockDetailParams }
) {
  const { id, stockId } = await params
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const supabase = getSupabaseAdminClient()

  const { error } = await supabase
    .from("inventario_items")
    .delete()
    .match({ id: stockId, prenda_id: id })

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: "Registro eliminado" })
}
