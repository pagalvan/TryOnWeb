import { NextResponse } from "next/server"

import { ensureAuthenticated } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function GET() {
  const { user, response } = await ensureAuthenticated()
  if (!user) {
    return response
  }

  return NextResponse.json({ data: user })
}
