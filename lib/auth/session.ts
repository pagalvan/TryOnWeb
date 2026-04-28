import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"

import { isProduction } from "@/lib/env.server"
import { verifySessionToken } from "@/lib/auth/jwt"
import type { AuthenticatedUser } from "@/lib/types/auth"

export const SESSION_COOKIE_NAME = "session"
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 // 7 days

export const setSessionCookie = (response: NextResponse, token: string) => {
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
}

export const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 0,
    path: "/",
  })
}

export const getAuthenticatedUser = async (): Promise<AuthenticatedUser | null> => {
  const store = await cookies()
  let sessionToken = store.get(SESSION_COOKIE_NAME)?.value

  if (!sessionToken) {
    const headersList = await headers()
    const authorization = headersList.get("authorization")
    if (authorization?.startsWith("Bearer ")) {
      sessionToken = authorization.substring(7)
    }
  }

  if (!sessionToken) {
    return null
  }

  return verifySessionToken(sessionToken)
}

export const ensureAuthenticated = async () => {
  const user = await getAuthenticatedUser()
  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ message: "No autorizado" }, { status: 401 }),
    }
  }

  return { user }
}

export const ensureAdmin = async () => {
  const result = await ensureAuthenticated()
  if (!result.user) {
    return result
  }

  if (result.user.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json({ message: "Permisos insuficientes" }, { status: 403 }),
    }
  }

  return result
}
