import { NextResponse } from "next/server"
import { setSessionCookie } from "@/lib/auth/session"
import { verifySessionToken } from "@/lib/auth/jwt"

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ message: "Token requerido" }, { status: 400 })
    }

    // Verify token is valid before setting it
    const user = await verifySessionToken(token)
    if (!user) {
      return NextResponse.json({ message: "Token inválido o expirado" }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    setSessionCookie(response, token)
    
    return response
  } catch (error) {
    console.error("Session switch error", error)
    return NextResponse.json({ message: "Error al cambiar de sesión" }, { status: 500 })
  }
}
