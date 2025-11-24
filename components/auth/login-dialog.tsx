"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!email || !password) {
      setError("Por favor ingresa email y contraseña")
      setLoading(false)
      return
    }

    try {
      // 1. Authenticate
      const response = await apiFetch<{ data: { role: string; token: string; nombre: string; email: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      const role = response.data?.role ?? "cliente"
      
      // 2. Save account locally
      if (response.data?.token) {
        const savedAccounts = JSON.parse(localStorage.getItem("savedAccounts") || "[]")
        const newAccount = {
          name: response.data.nombre || email.split("@")[0],
          email: response.data.email,
          role: role,
          token: response.data.token
        }
        
        // Remove existing entry for this email if exists to update it
        const filtered = savedAccounts.filter((a: any) => a.email !== newAccount.email)
        localStorage.setItem("savedAccounts", JSON.stringify([...filtered, newAccount]))
      }

      // 3. Switch session immediately
      await apiFetch("/api/auth/switch-session", {
        method: "POST",
        body: JSON.stringify({ token: response.data.token })
      })

      // 4. Reload to apply changes
      window.location.reload()

    } catch (err) {
      const message = err instanceof Error ? err.message : "No pudimos iniciar sesión"
      setError(message)
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background/95 backdrop-blur-xl border-border/50">
        <DialogHeader className="flex items-center justify-center pb-2">
          <Image src="/logo.png" alt="TryOnWeb" width={120} height={40} className="object-contain" />
          <DialogTitle className="sr-only">Agregar cuenta</DialogTitle>
          <DialogDescription className="sr-only">
            Inicia sesión para agregar otra cuenta a tu lista.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleLogin} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modal-email">Email</Label>
            <Input
              id="modal-email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modal-password">Contraseña</Label>
            <div className="relative">
              <Input
                id="modal-password"
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

          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
