import { NextRequest, NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { getDashboardOverview } from "@/lib/services/analytics.server"

export const runtime = "nodejs"

export async function GET(request: NextRequest) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  try {
    const params = request.nextUrl.searchParams

    const data = await getDashboardOverview({
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
      categoryId: params.get("categoryId") ?? undefined,
      location: params.get("location") ?? undefined,
      stockStatus: (params.get("stockStatus") as "all" | "warning" | "critical" | null) ?? undefined,
    })
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Dashboard overview failed", error)
    return NextResponse.json({ message: "No se pudo cargar el dashboard" }, { status: 500 })
  }
}
