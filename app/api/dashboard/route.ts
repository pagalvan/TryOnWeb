import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getDashboardOverview } from "@/lib/services/analytics.server"

export const runtime = "nodejs"

export async function GET() {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  try {
    const data = await getDashboardOverview()
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard overview failed", error)
    return NextResponse.json({ message: "No se pudo cargar el dashboard" }, { status: 500 })
  }
}
