"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Simular autenticación con credenciales hardcodeadas
    if (email === "admin@tryonweb.com" && password === "admin123") {
      localStorage.setItem("userRole", "admin")
      router.push("/dashboard")
    } else if (email === "cliente@tryonweb.com" && password === "cliente123") {
      localStorage.setItem("userRole", "cliente")
      router.push("/")
    } else if (email && password) {
      // Por defecto, cualquier otro usuario es cliente
      localStorage.setItem("userRole", "cliente")
      router.push("/")
    } else {
      setError("Por favor ingresa email y contraseña")
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
        </form>

        {/* Credenciales de prueba */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Credenciales de prueba:</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium">Admin:</span> admin@tryonweb.com / admin123
            </p>
            <p>
              <span className="font-medium">Cliente:</span> cliente@tryonweb.com / cliente123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-muted-foreground">
          <p>Prototipo educativo - Universidad 2025</p>
        </div>
      </Card>
    </div>
  )
}
