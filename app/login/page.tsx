"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import { apiFetch } from "@/lib/api-client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [showResetPrompt, setShowResetPrompt] = useState(false)
  const [resetMessage, setResetMessage] = useState("")
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setShowResetPrompt(false)
    setResetMessage("")

    if (!email || !password) {
      setError("Por favor ingresa email y contraseña")
      return
    }

    try {
      const response = await apiFetch<{ data: { role: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      const role = response.data?.role ?? "cliente"
      localStorage.setItem("userRole", role)
      router.push(role === "admin" ? "/dashboard" : "/")
    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar sesión"
      setError(message)
      setShowResetPrompt(true)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setResetMessage("Ingresa tu email para restablecer la contraseña")
      return
    }

    try {
      setResetLoading(true)
      setResetMessage("")
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      })

      setResetMessage("Enviamos un correo con instrucciones para restablecerla.")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="TryOnWeb Logo" width={160} height={64} className="object-contain" />
        </div>

        {/* Título */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Bienvenido</h1>
          <p className="text-muted-foreground">Ingresa tus credenciales para continuar</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Iniciar Sesión
          </Button>

          {showResetPrompt && (
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-sm font-semibold"
                onClick={handlePasswordReset}
                disabled={resetLoading}
              >
                ¿Olvidaste tu contraseña?
              </Button>
              {resetMessage && <p className="text-xs text-muted-foreground">{resetMessage}</p>}
            </div>
          )}
        </form>

        {/* Acción: ir a registro */}
        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">¿No tienes cuenta? </span>
          <Link href="/registro" className="font-semibold underline">
            Regístrate
          </Link>
        </div>
      </Card>
    </div>
  )
}
