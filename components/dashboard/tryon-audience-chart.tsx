"use client"

import { useMemo, type ComponentType } from "react"
import { CartesianGrid, Line, LineChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"

import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { DemandTrendPoint } from "@/lib/types/analytics"

const dayShortFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  timeZone: "America/Bogota",
})
const trimLabel = (value: string) => value.replaceAll(".", "").replace(/\s+/g, " ")
const WEEK_WINDOW = 7

type TryOnAudienceChartProps = {
  data: DemandTrendPoint[]
}

export function TryOnAudienceChart({ data }: TryOnAudienceChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const recent = sorted.slice(-WEEK_WINDOW)

    return recent.map((point) => {
      const label = trimLabel(dayShortFormatter.format(new Date(point.date)))
      return {
        day: label,
        views: point.views,
        tryons: point.tryons,
        returns: Math.max(0, Math.round(point.tryons * 0.35)),
      }
    })
  }, [data])

  const TooltipComponent = RechartsTooltip as unknown as ComponentType<any>

  return (
    <ChartContainer
      className="h-[260px]"
      config={{
        views: { label: "Vistas", color: "#22c55e" },
        tryons: { label: "Try-ons", color: "#2563eb" },
        returns: { label: "Devoluciones", color: "#f97316" },
      }}
    >
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
        <XAxis dataKey="day" axisLine={false} tickLine={false} />
        <YAxis axisLine={false} tickLine={false} width={32} />
        <TooltipComponent content={(props: any) => <ChartTooltipContent {...props} />} />
        <Line type="monotone" dataKey="views" stroke="var(--color-views)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="tryons" stroke="var(--color-tryons)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="returns"
          stroke="var(--color-returns)"
          strokeWidth={2}
          dot={false}
          strokeDasharray="4 4"
        />
      </LineChart>
    </ChartContainer>
  )
}
