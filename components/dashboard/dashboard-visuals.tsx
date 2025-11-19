"use client"

import { useMemo } from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import type { DemandTrendPoint, ProductTrafficItem, TryOnStats } from "@/lib/types/analytics"

const formatNumber = (value: number) => new Intl.NumberFormat("es-CO").format(value)

const dayShortFormatter = new Intl.DateTimeFormat("es-CO", { weekday: "short" })

const FEEDBACK_FALLBACK = [
  { key: "positive", name: "Disponible", value: 60 },
  { key: "neutral", name: "Atención", value: 25 },
  { key: "negative", name: "Crítico", value: 15 },
]

type TrafficPalette = Record<string, { bg: string; text: string }>

type DashboardVisualsProps = {
  panelClass: string
  demandTrendData: DemandTrendPoint[]
  productTrafficData: ProductTrafficItem[]
  totalProducts: number
  lowStockProducts: number
  criticalAlerts: number
  trafficPalette: TrafficPalette
  tryOnSummary: TryOnStats
}

export function DashboardVisuals({
  panelClass,
  demandTrendData,
  productTrafficData,
  totalProducts,
  lowStockProducts,
  criticalAlerts,
  trafficPalette,
  tryOnSummary,
}: DashboardVisualsProps) {
  const audienceLineData = useMemo(() => {
    return demandTrendData.map((point) => {
      const date = new Date(point.date)
      return {
        day: dayShortFormatter.format(date),
        revenue: point.views,
        orders: point.tryons,
        refunds: Math.max(0, Math.round(point.tryons * 0.35)),
      }
    })
  }, [demandTrendData])

  const stockHealthy = Math.max(totalProducts - lowStockProducts, 0)
  const stockWarning = Math.max(lowStockProducts - criticalAlerts, 0)
  const stockCritical = Math.max(criticalAlerts, 0)

  const rawFeedback = [
    { key: "positive", name: "Disponible", value: stockHealthy },
    { key: "neutral", name: "Atención", value: stockWarning },
    { key: "negative", name: "Crítico", value: stockCritical },
  ]
  const feedbackTotal = rawFeedback.reduce((acc, item) => acc + item.value, 0)
  const feedbackData = feedbackTotal > 0 ? rawFeedback : FEEDBACK_FALLBACK

  const visitsBySourceData = productTrafficData.map((item) => ({
    key: item.type,
    label: item.label,
    value: item.count,
  }))
  const maxVisitValue = visitsBySourceData.reduce((acc, item) => Math.max(acc, item.value), 0)

  const totalViews = visitsBySourceData.find((item) => item.key === "view")?.value ?? 0
  const totalTryOns = visitsBySourceData.find((item) => item.key === "tryon")?.value ?? 0
  const totalFavorites = visitsBySourceData.find((item) => item.key === "favorite")?.value ?? 0
  const totalShares = visitsBySourceData.find((item) => item.key === "share")?.value ?? 0

  const monthFormatter = new Intl.DateTimeFormat("es-CO", { month: "short" })
  const heroAreaData = demandTrendData.map((point) => {
    const date = new Date(point.date)
    return {
      month: monthFormatter.format(date),
      views: point.views,
      tryons: point.tryons,
    }
  })

  const heroMetrics = [
    { id: "users", label: "Usuarios", value: totalViews, accent: "from-[#a855f7] to-[#7c3aed]" },
    { id: "events", label: "Eventos", value: totalTryOns, accent: "from-[#fb923c] to-[#f97316]" },
    { id: "sessions", label: "Sesiones", value: tryOnSummary.sessions, accent: "from-[#34d399] to-[#10b981]" },
    { id: "new", label: "Nuevos", value: totalShares + totalFavorites, accent: "from-[#38bdf8] to-[#0ea5e9]" },
  ]

  const userPulseData = [
    { label: "Vistas", value: totalViews },
    { label: "Try-on", value: totalTryOns },
    { label: "Favoritos", value: totalFavorites },
    { label: "Shares", value: totalShares },
  ]

  return (
    <>
      <section className="grid gap-6 xl:grid-cols-12">
        <Card
          className={`${panelClass} xl:col-span-8`}
          style={{ background: "linear-gradient(160deg, #eff0ff 0%, #dfe1ff 100%)" }}
        >
          <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-none p-6 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Panorama de interacción</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Evolución mensual de vistas y try-ons del catálogo principal.
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full border-transparent bg-white/80 text-slate-600 shadow-sm">
              Últimos 12 meses
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <ChartContainer
              className="h-[220px]"
              config={{
                views: { label: "Vistas", color: "#7c3aed" },
                tryons: { label: "Try-ons", color: "#38bdf8" },
              }}
            >
              <AreaChart data={heroAreaData}>
                <defs>
                  <linearGradient id="areaViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="areaTryons" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={32} />
                <RechartsTooltip content={<ChartTooltipContent />} cursor={{ stroke: "#c4b5fd", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="views" stroke="#7c3aed" strokeWidth={2.5} fill="url(#areaViews)" />
                <Area type="monotone" dataKey="tryons" stroke="#38bdf8" strokeWidth={2.5} fill="url(#areaTryons)" />
              </AreaChart>
            </ChartContainer>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {heroMetrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(metric.value)}</p>
                  </div>
                  <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${metric.accent} text-white text-sm font-semibold`}>
                    {metric.id === "users" ? "UA" : metric.id === "events" ? "EV" : metric.id === "sessions" ? "SE" : "NU"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={`${panelClass} xl:col-span-4`} style={{ background: "linear-gradient(145deg, #fdf2ff 0%, #f5d9ff 100%)" }}>
          <CardHeader className="flex flex-wrap items-center justify-between gap-2 border-none p-6 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Usuarios activos</CardTitle>
              <CardDescription className="text-sm text-slate-600">Actividad reciente por minuto.</CardDescription>
            </div>
            <span className="text-3xl font-semibold text-slate-900">{formatNumber(totalViews || tryOnSummary.sessions)}</span>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <ChartContainer className="h-[140px]" config={{ pulse: { label: "Actividad", color: "#a855f7" } }}>
              <BarChart data={userPulseData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={28} />
                <RechartsTooltip content={<ChartTooltipContent />} cursor={{ fill: "rgba(168,85,247,0.12)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="var(--color-pulse)" />
              </BarChart>
            </ChartContainer>

            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 text-sm text-slate-600">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Fuente</span>
                <span>Usuarios</span>
              </div>
              <div className="mt-3 space-y-2">
                {visitsBySourceData.slice(0, 4).map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${trafficPalette[entry.key]?.bg ?? "bg-slate-100"} ${trafficPalette[entry.key]?.text ?? "text-slate-600"}`}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {entry.label}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatNumber(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card
          className={`${panelClass} xl:col-span-12`}
          style={{ background: "linear-gradient(135deg, #dbeafe 0%, #c7d2fe 100%)" }}
        >
          <CardHeader className="flex flex-wrap items-center justify-between gap-4 border-none p-6 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Audiencia del probador</CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Curvas comparativas de views, try-ons y devoluciones.
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full border-transparent bg-slate-100 text-slate-600">
              Semana móvil
            </Badge>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <ChartContainer
              className="h-[260px]"
              config={{
                revenue: { label: "Nuevos ingresos", color: "#22c55e" },
                orders: { label: "Órdenes", color: "#2563eb" },
                refunds: { label: "Devoluciones", color: "#f97316" },
              }}
            >
              <LineChart data={audienceLineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} width={32} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="orders" stroke="var(--color-orders)" strokeWidth={2} dot={false} />
                <Line
                  type="monotone"
                  dataKey="refunds"
                  stroke="var(--color-refunds)"
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-12">
        <Card
          className={`${panelClass} xl:col-span-6`}
          style={{ background: "linear-gradient(135deg, #ffe0f1 0%, #ffd1ea 100%)" }}
        >
          <CardHeader className="flex items-center justify-between border-none p-6 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Feedback inventario</CardTitle>
              <CardDescription className="text-sm text-slate-600">Estado global de existencias por criticidad.</CardDescription>
            </div>
            <span className="text-xs font-semibold text-slate-500">{formatNumber(feedbackTotal || 100)} ítems</span>
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
                  data={feedbackData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  strokeWidth={4}
                >
                  {feedbackData.map((entry) => (
                    <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltipContent nameKey="key" />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-4 grid gap-2 text-sm">
              {feedbackData.map((entry) => {
                const percentage = feedbackTotal > 0 ? Math.round((entry.value / feedbackTotal) * 100) : entry.value
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
          </CardContent>
        </Card>

        <Card
          className={`${panelClass} xl:col-span-6`}
          style={{ background: "linear-gradient(135deg, #fff4d7 0%, #ffe6a7 100%)" }}
        >
          <CardHeader className="flex items-center justify-between border-none p-6 pb-3">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Visitas por canal</CardTitle>
              <CardDescription className="text-sm text-slate-600">Desglose semanal por fuente de tráfico.</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full border-transparent bg-slate-100 text-slate-600">
              Semana
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {visitsBySourceData.map((entry) => {
              const width = maxVisitValue > 0 ? Math.round((entry.value / maxVisitValue) * 100) : 0
              const palette = trafficPalette[entry.key] ?? { bg: "bg-slate-100", text: "text-slate-600" }
              return (
                <div key={entry.key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>{entry.label}</span>
                    <span>{formatNumber(entry.value)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-2 rounded-full ${palette.bg} ${palette.text}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

      </section>
    </>
  )
}
