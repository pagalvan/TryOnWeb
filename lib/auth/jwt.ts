import jwt from "jsonwebtoken"

import { serverEnv } from "@/lib/env.server"
import type { AuthenticatedUser } from "@/lib/types/auth"

const TOKEN_EXPIRATION = "7d"

export const signSessionToken = (payload: AuthenticatedUser) =>
  jwt.sign(payload, serverEnv.jwtSecret, { expiresIn: TOKEN_EXPIRATION })

export const verifySessionToken = (token: string): AuthenticatedUser | null => {
  try {
    return jwt.verify(token, serverEnv.jwtSecret) as AuthenticatedUser
  } catch (error) {
    console.error("Invalid session token", error)
    return null
  }
}
