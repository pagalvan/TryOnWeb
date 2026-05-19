"use client"

import { useState } from "react"
import { Shield } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { type SettingsFormState, type PasswordFormState } from "./types"

interface SecurityCardProps {
  form: SettingsFormState
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
  onPasswordSubmit: (passwordForm: PasswordFormState) => Promise<void>
}

export function SecurityCard({ form, onChange, onPasswordSubmit }: SecurityCardProps) {
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({ newPassword: "", confirmPassword: "" })
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setChangingPassword(true)
    try {
      await onPasswordSubmit(passwordForm)
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Actualiza tu contraseña y preferencias de acceso</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input
              id="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
              }
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
              }
              placeholder="••••••••"
            />
          </div>
          <div className="md:col-span-2 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Usa una contraseña de al menos 8 caracteres. Esta acción actualiza tu usuario en Supabase.
            </div>
            <Button type="submit" disabled={changingPassword} variant="outline">
              {changingPassword ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4" /> Guardando
                </span>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Autenticación de dos factores</p>
            <p className="text-sm text-muted-foreground">
              Habilita el registro de dispositivos confiables y notificaciones de acceso.
            </p>
          </div>
          <Switch
            checked={form.security.twoFactor}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      security: { ...current.security, twoFactor: checked },
                    }
                  : current
              )
            }
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Próximamente enviaremos códigos de respaldo cuando actives esta opción.
        </p>
      </CardContent>
    </Card>
  )
}
