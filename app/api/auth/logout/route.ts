import { NextResponse } from "next/server"

import { clearSessionCookie } from "@/lib/auth/session"

export const runtime = "nodejs"

export async function POST() {
  const response = NextResponse.json({ message: "Sesión finalizada" })
  clearSessionCookie(response)
  return response
}
