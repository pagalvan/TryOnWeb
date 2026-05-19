"use client"

import { Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { type SettingsFormState } from "./types"

interface NotificationsCardProps {
  form: SettingsFormState
  onChange: (updater: (current: SettingsFormState | null) => SettingsFormState | null) => void
}

export function NotificationsCard({ form, onChange }: NotificationsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Notificaciones</CardTitle>
            <CardDescription>Define qué alertas enviaremos al equipo</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Alertas de stock crítico</p>
            <p className="text-sm text-muted-foreground">
              Enviamos un correo cuando la bodega llegue al mínimo configurado.
            </p>
          </div>
          <Switch
            checked={form.notifications.stockAlerts}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      notifications: { ...current.notifications, stockAlerts: checked },
                    }
                  : current
              )
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Resumen semanal</p>
            <p className="text-sm text-muted-foreground">
              Incluye métricas clave de inventario y sesiones del probador virtual.
            </p>
          </div>
          <Switch
            checked={form.notifications.weeklyReports}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      notifications: { ...current.notifications, weeklyReports: checked },
                    }
                  : current
              )
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Nuevos intentos AR</p>
            <p className="text-sm text-muted-foreground">
              Recibe una alerta cuando un cliente use el probador virtual.
            </p>
          </div>
          <Switch
            checked={form.notifications.newTryons}
            onCheckedChange={(checked) =>
              onChange((current) =>
                current
                  ? {
                      ...current,
                      notifications: { ...current.notifications, newTryons: checked },
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
