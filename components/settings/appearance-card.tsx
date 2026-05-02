"use client"

import { Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type SettingsFormState } from "./types"

interface AppearanceCardProps {
  form: SettingsFormState
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
}

export function AppearanceCard({ form, onChange }: AppearanceCardProps) {
  const { setTheme } = useTheme()

  const handleThemeChange = (value: "light" | "dark" | "system") => {
    setTheme(value)
    onChange((current) => {
      if (!current) return current
      return { ...current, appearance: { ...current.appearance, theme: value } }
    })
  }

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
            <p className="font-medium text-foreground">Tema visual</p>
            <p className="text-sm text-muted-foreground">Elige cómo quieres ver la plataforma.</p>
          </div>
          <Select value={form.appearance.theme} onValueChange={handleThemeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecciona un tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Oscuro</SelectItem>
              <SelectItem value="system">Automático (Sistema)</SelectItem>
            </SelectContent>
          </Select>
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
