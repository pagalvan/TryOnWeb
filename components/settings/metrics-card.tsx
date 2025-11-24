"use client"

import { Database } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type SettingsMetrics } from "@/lib/types/settings"
import { formatDateTime, formatInventoryUnits, numberFormatter } from "./types"

interface MetricsCardProps {
  metrics: SettingsMetrics
}

export function MetricsCard({ metrics }: MetricsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Salud de datos</CardTitle>
            <CardDescription>Resumen generado con información real del inventario</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Productos en catálogo</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {numberFormatter.format(metrics.totalProducts)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Categorías registradas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {numberFormatter.format(metrics.totalCategories)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Unidades en inventario</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatInventoryUnits(metrics.totalInventoryUnits)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Alertas de stock activas</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {numberFormatter.format(metrics.lowStockLocations)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Sesiones de probador virtual</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {numberFormatter.format(metrics.tryOnSessions)}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm text-muted-foreground">Último reporte de inventario</p>
          <p className="mt-1 text-lg font-medium text-foreground">
            {formatDateTime(metrics.lastInventoryReport)}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
