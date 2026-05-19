"use client"

import { useState } from "react"
import { Eye, EyeOff, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { type SettingsFormState } from "./types"

interface LensCardProps {
  form: SettingsFormState
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
}

export function LensCard({ form, onChange }: LensCardProps) {
  const [lensKeyVisible, setLensKeyVisible] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Integración Lens Studio</CardTitle>
            <CardDescription>Configura la conexión con tus lentes y modelos 3D</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="lensKey">API key de Lens Studio</Label>
          <div className="flex items-center gap-2">
            <Input
              id="lensKey"
              value={form.lens.apiKey}
              onChange={(event) =>
                onChange((current) =>
                  current
                    ? {
                        ...current,
                        lens: { ...current.lens, apiKey: event.target.value },
                      }
                    : current
                )
              }
              type={lensKeyVisible ? "text" : "password"}
              placeholder="Ingresa tu API key"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setLensKeyVisible((previous) => !previous)}
              className="px-3"
            >
              {lensKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Guardamos esta clave asociada a tu perfil en Supabase. Si cambias el valor, reemplazaremos la clave actual.
          </p>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Calidad de renderizado</p>
            <p className="text-sm text-muted-foreground">Activa la calidad alta para catálogos premium.</p>
          </div>
          <Switch
            checked={form.lens.renderQuality === "high"}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      lens: { ...current.lens, renderQuality: checked ? "high" : "standard" },
                    }
                  : current
              )
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Tracking facial avanzado</p>
            <p className="text-sm text-muted-foreground">
              Mejora el anclaje de los lentes en dispositivos compatibles.
            </p>
          </div>
          <Switch
            checked={form.lens.advancedFaceTracking}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      lens: { ...current.lens, advancedFaceTracking: checked },
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
