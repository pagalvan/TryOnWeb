"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { apiFetch } from "@/lib/api-client"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [statusMessage, setStatusMessage] = useState("")
  const [isReady, setIsReady] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    const processRecoveryLink = async () => {
      const token = extractToken()
      if (!token) {
        setError("Enlace inválido o vencido. Solicita nuevamente el restablecimiento.")
        return
      }

      setAccessToken(token)
      setIsReady(true)
    }

    processRecoveryLink()
  }, [])

  const extractToken = () => {
    if (typeof window === "undefined") return null

    const parseParams = (raw: string) => {
      const params = new URLSearchParams(raw)
      if (params.get("type") !== "recovery") return null
      const access_token = params.get("access_token")
      if (!access_token) return null
      return access_token
    }

    if (window.location.hash) {
      const data = parseParams(window.location.hash.slice(1))
      if (data) return data
    }

    if (window.location.search) {
      const data = parseParams(window.location.search.slice(1))
      if (data) return data
    }

    return null
  }

  const handlePasswordUpdate = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setStatusMessage("")

    if (!password || password.length < 6) {
      setError("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.")
      return
    }

    if (!accessToken) {
      setError("Token inválido. Solicita un nuevo enlace.")
      return
    }

    try {
      setIsSubmitting(true)
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ accessToken, password }),
      })

      setStatusMessage("Contraseña actualizada. Ya puedes iniciar sesión nuevamente.")
      setTimeout(() => router.push("/login"), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <Image src="/logo.png" alt="TryOnWeb Logo" width={120} height={48} />
          <h1 className="font-display text-2xl font-semibold">Restablecer contraseña</h1>
          <p className="text-sm text-muted-foreground">
            Ingresa una nueva contraseña para tu cuenta.
          </p>
        </div>

        {!isReady ? (
          <p className="text-sm text-center text-muted-foreground">
            {error || "Validando enlace de recuperación..."}
          </p>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            {statusMessage && <p className="text-sm text-green-600">{statusMessage}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  )
}
