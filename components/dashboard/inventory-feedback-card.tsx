"use client"

import type { ComponentType } from "react"
import { Pie, PieChart, Cell, Tooltip as RechartsTooltip } from "recharts"

import { formatNumber } from "@/app/dashboard/_data"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const FALLBACK_FEEDBACK = [
  { key: "positive" as const, name: "Disponible", value: 60 },
  { key: "neutral" as const, name: "Atención", value: 25 },
  { key: "negative" as const, name: "Crítico", value: 15 },
]

export type InventoryFeedbackDatum = {
  key: "positive" | "neutral" | "negative"
  name: string
  value: number
}

type InventoryFeedbackCardProps = {
  panelClass: string
  data: InventoryFeedbackDatum[]
  total: number
}

export function InventoryFeedbackCard({ panelClass, data, total }: InventoryFeedbackCardProps) {
  const hasData = total > 0
  const effectiveData = hasData ? data : FALLBACK_FEEDBACK
  const effectiveTotal = hasData
    ? total
    : FALLBACK_FEEDBACK.reduce((acc, item) => acc + item.value, 0)
  const TooltipComponent = RechartsTooltip as unknown as ComponentType<any>

  return (
    <Card
      className={`${panelClass} xl:col-span-12`}
      style={{ background: "linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)" }}
    >
      <CardHeader className="flex items-center justify-between border-none p-6 pb-3">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">Feedback inventario</CardTitle>
          <CardDescription className="text-sm text-slate-600">Estado global de existencias por criticidad.</CardDescription>
        </div>
        <span className="text-xs font-semibold text-slate-500">{formatNumber(effectiveTotal)} ítems</span>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ChartContainer
          className="h-[240px]"
          config={{
            positive: { label: "Disponible", color: "#7c3aed" },
            neutral: { label: "Atención", color: "#0ea5e9" },
            negative: { label: "Crítico", color: "#ec4899" },
          }}
        >
            <PieChart>
            <Pie
              data={effectiveData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={4}
            >
              {effectiveData.map((entry) => (
                <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
              ))}
            </Pie>
              <TooltipComponent content={(props: any) => <ChartTooltipContent {...props} />} />
          </PieChart>
        </ChartContainer>
        <div className="mt-4 grid gap-2 text-sm">
          {effectiveData.map((entry) => {
            const percentage = effectiveTotal > 0 ? Math.round((entry.value / effectiveTotal) * 100) : 0
            return (
              <div key={entry.key} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `var(--color-${entry.key})` }} />
                  {entry.name}
                </span>
                <span className="font-semibold text-slate-900">{percentage}%</span>
              </div>
            )
          })}
        </div>
        {!hasData ? (
          <p className="mt-3 text-xs text-slate-500">Mostramos una distribución de referencia hasta recibir inventario actualizado.</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
