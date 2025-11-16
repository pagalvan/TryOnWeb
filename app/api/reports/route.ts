import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getReportsOverview } from "@/lib/services/analytics.server"

export const runtime = "nodejs"

export async function GET() {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  try {
    const data = await getReportsOverview()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Reports overview failed", error)
    return NextResponse.json({ message: "No se pudo cargar los reportes" }, { status: 500 })
  }
}
