"use client"

import { Palette } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { type SettingsFormState } from "./types"

interface AppearanceCardProps {
  form: SettingsFormState
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
  onThemeChange: (isDark: boolean) => void
}

export function AppearanceCard({ form, onChange, onThemeChange }: AppearanceCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Apariencia</CardTitle>
            <CardDescription>Sincronizamos el tema con tus preferencias</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Modo oscuro</p>
            <p className="text-sm text-muted-foreground">Aplicamos el tema oscuro en toda la plataforma.</p>
          </div>
          <Switch
            checked={form.appearance.darkMode}
            onCheckedChange={(checked) =>
              onChange((current) => {
                if (!current) return current
                onThemeChange(checked)
                return { ...current, appearance: { ...current.appearance, darkMode: checked } }
              })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Animaciones</p>
            <p className="text-sm text-muted-foreground">Suaviza las transiciones de dashboards y listados.</p>
          </div>
          <Switch
            checked={form.appearance.animations}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      appearance: { ...current.appearance, animations: checked },
                    }
                  : current
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
