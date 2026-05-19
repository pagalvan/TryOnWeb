"use client"

import { User } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type SettingsFormState } from "./types"

interface ProfileCardProps {
  form: SettingsFormState
  email: string
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
}

export function ProfileCard({ form, email, onChange }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Perfil de usuario</CardTitle>
            <CardDescription>Datos que usaremos en reportes y notificaciones</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="displayName">Nombre</Label>
            <Input
              id="displayName"
              value={form.displayName}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, displayName: event.target.value } : current))
              }
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono de contacto</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, phone: event.target.value } : current))
              }
              placeholder="Tu número de contacto"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Empresa</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(event) =>
                onChange((current) => (current ? { ...current, company: event.target.value } : current))
              }
              placeholder="Nombre de la empresa"
            />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Los ajustes de notificaciones, apariencia y Lens Studio se guardarán junto con tus datos de perfil.
        </p>
      </CardContent>
    </Card>
  )
}
