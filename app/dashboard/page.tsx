import { AlertTriangle, ArrowDownRight, ArrowUpRight, Banknote, Boxes, Eye, List } from "lucide-react"

import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button"
import type { DashboardExportData } from "@/components/dashboard/dashboard-export-sheet"
import { DemandTrendWidget } from "@/components/dashboard/demand-trend-widget"
import { InventoryFlowChart } from "@/components/dashboard/inventory-flow-chart"
import { DashboardVisuals } from "@/components/dashboard/dashboard-visuals"
import { TryOnTrendChart } from "@/components/dashboard/tryon-trend-chart"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchDashboardOverview } from "@/lib/services/dashboard"
import { fetchReportsOverview } from "@/lib/services/reports"
import type {
  DashboardFiltersInput,
  DemandTrendPoint,
  InventoryFlowPoint,
  ProductTrafficItem,
  TryOnTrendPoint,
} from "@/lib/types/analytics"

const formatNumber = (value: number) => new Intl.NumberFormat("es-CO").format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)

const formatPercentage = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`

const formatDelta = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—"
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds % 60)
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

const COMMON_TIMEZONE: Intl.DateTimeFormatOptions["timeZone"] = "America/Bogota"

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: COMMON_TIMEZONE,
  }).format(new Date(value))

const formatShortDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(date)
}

const formatDateRange = (from: string, to: string) => {
  const start = new Date(from)
  const end = new Date(to)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "—"

  const formatter = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
  return `${formatter.format(start)} - ${formatter.format(end)}`
}

const FALLBACK_INVENTORY_FLOW: InventoryFlowPoint[] = [
  { date: "2024-01-05", inbound: 120, outbound: 80 },
  { date: "2024-01-12", inbound: 150, outbound: 90 },
  { date: "2024-01-19", inbound: 140, outbound: 110 },
  { date: "2024-01-26", inbound: 160, outbound: 120 },
  { date: "2024-02-02", inbound: 170, outbound: 115 },
  { date: "2024-02-09", inbound: 180, outbound: 130 },
  { date: "2024-02-16", inbound: 190, outbound: 140 },
  { date: "2024-02-23", inbound: 210, outbound: 150 },
]

const FALLBACK_TRYON_TREND: TryOnTrendPoint[] = [
  { date: "2024-01-05", sessions: 45, items: 110 },
  { date: "2024-01-12", sessions: 52, items: 118 },
  { date: "2024-01-19", sessions: 60, items: 130 },
  { date: "2024-01-26", sessions: 66, items: 145 },
  { date: "2024-02-02", sessions: 70, items: 152 },
  { date: "2024-02-09", sessions: 74, items: 160 },
  { date: "2024-02-16", sessions: 79, items: 172 },
  { date: "2024-02-23", sessions: 83, items: 185 },
]

const FALLBACK_DEMAND_TREND: DemandTrendPoint[] = [
  { date: "2024-01-05", views: 820, tryons: 210 },
  { date: "2024-01-12", views: 860, tryons: 225 },
  { date: "2024-01-19", views: 910, tryons: 240 },
  { date: "2024-01-26", views: 950, tryons: 255 },
  { date: "2024-02-02", views: 980, tryons: 265 },
  { date: "2024-02-09", views: 1010, tryons: 278 },
  { date: "2024-02-16", views: 1050, tryons: 292 },
  { date: "2024-02-23", views: 1085, tryons: 304 },
]

const FALLBACK_PRODUCT_TRAFFIC: ProductTrafficItem[] = [
  { type: "view", label: "Vistas", count: 5200 },
  { type: "tryon", label: "Try-ons", count: 1480 },
  { type: "favorite", label: "Favoritos", count: 640 },
  { type: "share", label: "Compartidos", count: 320 },
]

type DashboardPageSearchParams = Record<string, string | string[] | undefined>

const toSingleValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

const parseFiltersFromSearchParams = (searchParams?: DashboardPageSearchParams): DashboardFiltersInput => {
  if (!searchParams) return {}

  const filters: DashboardFiltersInput = {}
  const from = toSingleValue(searchParams.from)
  const to = toSingleValue(searchParams.to)
  const categoryId = toSingleValue(searchParams.categoryId)
  const location = toSingleValue(searchParams.location)
  const stockStatus = toSingleValue(searchParams.stockStatus)

  if (from) filters.from = from
  if (to) filters.to = to
  if (categoryId) filters.categoryId = categoryId
  if (location) filters.location = location
  if (stockStatus === "all" || stockStatus === "warning" || stockStatus === "critical") {
    filters.stockStatus = stockStatus
  }

  return filters
}

type DashboardPageProps = {
  searchParams?: DashboardPageSearchParams
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const filters = parseFiltersFromSearchParams(searchParams)

  const [overview, reportsOverview] = await Promise.all([
    fetchDashboardOverview(filters),
    fetchReportsOverview(),
  ])

  const panelClass = "rounded-3xl border border-slate-100/70 bg-white/80 shadow-[0_25px_60px_-12px_rgba(15,23,42,0.18)] backdrop-blur-sm"
  const hasInventoryFlow = overview.inventoryFlow.length > 0
  const hasTryOnTrend = overview.tryOn.trend.length > 0
  const hasDemandTrend = overview.demandTrend.length > 0
  const hasProductTraffic = overview.productTraffic.length > 0

  const inventoryFlowData = hasInventoryFlow ? overview.inventoryFlow : FALLBACK_INVENTORY_FLOW
  const tryOnTrendData = hasTryOnTrend ? overview.tryOn.trend : FALLBACK_TRYON_TREND
  const demandTrendData = hasDemandTrend ? overview.demandTrend : FALLBACK_DEMAND_TREND
  const productTrafficData = hasProductTraffic ? overview.productTraffic : FALLBACK_PRODUCT_TRAFFIC

  const trafficTotal = productTrafficData.reduce((total, item) => total + item.count, 0)
  const totalViews = productTrafficData.find((item) => item.type === "view")?.count ?? 0
  const totalTryOns = productTrafficData.find((item) => item.type === "tryon")?.count ?? 0
  const conversionRate = totalViews > 0 ? (totalTryOns / totalViews) * 100 : 0
  const stockHealth = overview.metrics.totalProducts > 0
    ? Math.max(0, Math.min(100, Math.round(((overview.metrics.totalProducts - overview.metrics.lowStockProducts) / overview.metrics.totalProducts) * 100)))
    : 100
  const inboundTotal = inventoryFlowData.reduce((acc, point) => acc + point.inbound, 0)
  const outboundTotal = inventoryFlowData.reduce((acc, point) => acc + point.outbound, 0)
  const turnoverRate = overview.metrics.totalStockUnits > 0 ? (outboundTotal / overview.metrics.totalStockUnits) * 100 : 0
  const criticalAlerts = overview.inventory.lowStock.filter((item) => item.status === "critical").length
  const topProductPeak = overview.topProducts.reduce((acc, product) => {
    const total = product.views + product.tryons + product.favorites + product.shares
    return total > acc ? total : acc
  }, 0) || 1

  const lowStockPreview = overview.inventory.lowStock.slice(0, 4)
  const movementsPreview = overview.inventory.movements.slice(0, 6)
  const categoriesPreview = overview.categories.slice(0, 5)

  const activeCategory = overview.context.filters.categoryId
    ? overview.context.availableFilters.categories.find((category) => category.id === overview.context.filters.categoryId)?.nombre ?? "Categoría filtrada"
    : null
  const activeLocation = overview.context.filters.location
  const statusLabel = overview.context.filters.stockStatus !== "all"
    ? overview.context.filters.stockStatus === "critical"
      ? "Alertas críticas"
      : "Alertas en seguimiento"
    : null

  const stockChangeRate = overview.metrics.totalStockUnits > 0 ? ((inboundTotal - outboundTotal) / overview.metrics.totalStockUnits) * 100 : 0

  const tryOnSummary = overview.tryOn.summary

  const reportsPreview = reportsOverview.recentReports.slice(0, 4)

  const locationSummaries = overview.locations ?? []
  const activeLocations = locationSummaries.length
  const totalLocationUnits = locationSummaries.reduce((acc, item) => acc + item.totalUnits, 0)
  const totalLocationValue = locationSummaries.reduce((acc, item) => acc + item.inventoryValue, 0)
  const locationDistribution = locationSummaries.map((summary) => ({
    label: summary.location,
    units: summary.totalUnits,
    percent: totalLocationUnits > 0 ? Math.round((summary.totalUnits / totalLocationUnits) * 100) : 0,
    formattedUnits: formatNumber(summary.totalUnits),
    productCount: summary.productCount,
    formattedProducts: formatNumber(summary.productCount),
  }))
  const locationAlerts = locationSummaries
    .map((summary) => ({
      label: summary.location,
      low: summary.lowStockCount,
      critical: summary.criticalCount,
    }))
    .filter((item) => item.low > 0 || item.critical > 0)

  const maxAlertTotal = locationAlerts.reduce((acc, item) => Math.max(acc, item.low + item.critical), 0) || 1

  const overviewCards = [
    {
      id: "inventory-value",
      label: "Valor inventario",
      value: formatCurrency(overview.metrics.totalInventoryValue),
      helper: "Rotación del período",
      delta: formatDelta(turnoverRate),
      deltaValue: turnoverRate,
      icon: Banknote,
      accent: "from-indigo-500 to-indigo-600",
    },
    {
      id: "available-units",
      label: "Unidades disponibles",
      value: formatNumber(overview.metrics.totalStockUnits),
      helper: "Balance entradas vs salidas",
      delta: formatDelta(stockChangeRate),
      deltaValue: stockChangeRate,
      icon: Boxes,
      accent: "from-sky-500 to-sky-600",
    },
    {
      id: "tryon",
      label: "Probador virtual",
      value: formatNumber(totalTryOns),
      helper: `Sesiones ${formatNumber(tryOnSummary.sessions)}`,
      delta: formatPercentage(conversionRate),
      deltaValue: conversionRate,
      icon: Eye,
      accent: "from-rose-500 to-rose-600",
    },
  ] as const

  const quickTryOnStats = [
    { id: "sessions", label: "Sesiones", value: formatNumber(tryOnSummary.sessions) },
    { id: "items", label: "Items escaneados", value: formatNumber(tryOnSummary.items) },
    { id: "duration", label: "Duración promedio", value: formatDuration(tryOnSummary.averageDurationSeconds) },
    { id: "unique", label: "Productos únicos", value: formatNumber(tryOnSummary.uniqueProducts) },
  ]

  const trafficColors: Record<string, { bg: string; text: string }> = {
    view: { bg: "bg-indigo-50", text: "text-indigo-600" },
    tryon: { bg: "bg-emerald-50", text: "text-emerald-600" },
    favorite: { bg: "bg-rose-50", text: "text-rose-600" },
    share: { bg: "bg-amber-50", text: "text-amber-600" },
  }

  const exportBadges: string[] = []
  if (activeCategory) exportBadges.push(`Categoría ${activeCategory}`)
  if (activeLocation) exportBadges.push(`Ubicación ${activeLocation}`)
  if (statusLabel) exportBadges.push(statusLabel)

  const toSparkline = (values: number[]) => {
    const trimmed = values.slice(-8)
    return trimmed.length > 1 ? trimmed : undefined
  }

  const sparklineMap: Record<string, number[] | undefined> = {
    "inventory-value": toSparkline(inventoryFlowData.map((point) => point.inbound)),
    "available-units": toSparkline(inventoryFlowData.map((point) => point.inbound + point.outbound)),
    tryon: toSparkline(tryOnTrendData.map((point) => point.sessions)),
  }

  const cardSourceMap: Record<string, string> = {
    "inventory-value": "Inventario",
    "available-units": "Almacén",
    tryon: "TryOnWeb",
  }

  const cardProgressMap: Record<string, number> = {
    "inventory-value": Math.min(100, Math.max(0, Math.round(turnoverRate))),
    "available-units": Math.round(stockHealth),
    tryon: Math.min(100, Math.max(0, Math.round(conversionRate))),
  }

  const inventoryFlowExport = inventoryFlowData.slice(-6).map((point) => ({
    label: formatShortDate(point.date),
    inbound: point.inbound,
    outbound: point.outbound,
  }))

  const tryOnTrendExport = tryOnTrendData.slice(-6).map((point) => ({
    label: formatShortDate(point.date),
    sessions: point.sessions,
    items: point.items,
  }))

  const demandTrendExport = demandTrendData.slice(-6).map((point) => ({
    label: formatShortDate(point.date),
    sessions: formatNumber(point.tryons),
    rawSessions: point.tryons,
  }))

  const audienceSeries = demandTrendData.slice(-6).map((point) => ({
    label: formatShortDate(point.date),
    views: point.views,
    tryons: point.tryons,
  }))

  const inventoryStatusSummary = [
    {
      label: "Disponible",
      value: Math.max(overview.metrics.totalProducts - overview.metrics.lowStockProducts, 0),
    },
    {
      label: "Atención",
      value: overview.inventory.lowStock.filter((item) => item.status === "warning").length,
    },
    {
      label: "Crítico",
      value: overview.inventory.lowStock.filter((item) => item.status === "critical").length,
    },
  ]

  const trafficExport = productTrafficData.map((item) => ({
    label: item.label,
    value: formatNumber(item.count),
    count: item.count,
  }))

  const categoryBreakdownExport = categoriesPreview.map((category) => ({
    label: category.nombre,
    value: category.productCount ?? 0,
  }))

  const movementsExport = movementsPreview.map((movement) => {
    const isInbound = movement.type.toLowerCase().includes("in")
    return {
      id: movement.id,
      description: `${movement.motive ?? movement.type} · ${movement.location ?? "Sin ubicación"}`,
      date: formatDateTime(movement.timestamp),
      quantity: `${isInbound ? "+" : "-"}${formatNumber(movement.quantity)} uds`,
      direction: (isInbound ? "in" : "out") as "in" | "out",
    }
  })

  const reportsExport = reportsPreview.map((report) => ({
    id: report.id,
    title: report.type,
    date: formatDateTime(report.createdAt),
    summary: report.summary ?? undefined,
  }))

  const stockHighlight = overview.inventory.lowStock[0]
    ? {
        product: overview.inventory.lowStock[0].productName,
        sku: overview.inventory.lowStock[0].sku ?? undefined,
        status: overview.inventory.lowStock[0].status === "critical" ? "Crítico" : "Alerta",
        stock: formatNumber(overview.inventory.lowStock[0].totalStock),
        minimum: formatNumber(overview.inventory.lowStock[0].minimumStock),
        location: overview.inventory.lowStock[0].locations[0]
          ? `${overview.inventory.lowStock[0].locations[0].location}: ${formatNumber(overview.inventory.lowStock[0].locations[0].quantity)} uds`
          : undefined,
      }
    : undefined

  const locationOverviewExport = {
    inventoryValue: formatCurrency(totalLocationValue),
    totalUnits: formatNumber(totalLocationUnits),
    activeLocations,
    distribution: locationDistribution.map((item) => ({
      label: item.label,
      units: item.formattedUnits,
      percent: Math.min(item.percent, 100),
      products: item.formattedProducts,
    })),
    alerts: locationSummaries.map((summary) => ({
      label: summary.location,
      low: summary.lowStockCount,
      critical: summary.criticalCount,
      budget: Math.round(((summary.lowStockCount + summary.criticalCount) / maxAlertTotal) * 100),
    })),
  }

  const conversionRateLabel = formatPercentage(conversionRate)

  const exportData: DashboardExportData = {
    title: "Operaciones de inventario",
    subtitle: "Panel ejecutivo TryOnWeb",
    generatedLabel: formatDateTime(overview.context.generatedAt),
    periodLabel: formatDateRange(overview.context.filters.from, overview.context.filters.to),
    badges: exportBadges,
    cards: overviewCards.map((card) => ({
      id: card.id,
      label: card.label,
      value: card.value,
      helper: card.helper,
      delta: card.delta,
      deltaTrend: card.deltaValue >= 0 ? "up" : "down",
      periodLabel: "Mes en curso",
      source: cardSourceMap[card.id],
      progress: cardProgressMap[card.id],
      sparkline: sparklineMap[card.id],
    })),
    quickStats: quickTryOnStats,
    traffic: trafficExport,
    demandTrend: demandTrendExport,
    inventoryFlow: inventoryFlowExport,
    tryOnTrend: tryOnTrendExport,
    topProducts: overview.topProducts.slice(0, 5).map((product, index) => ({
      label: `${index + 1}. ${product.productName}`,
      tryons: formatNumber(product.tryons),
      favorites: formatNumber(product.favorites),
      shares: formatNumber(product.shares),
      totalInteractions: product.views + product.tryons + product.favorites + product.shares,
    })),
    lowStock:
      overview.inventory.lowStock.length > 0
        ? overview.inventory.lowStock.slice(0, 5).map((item) => ({
            label: item.productName,
            stock: formatNumber(item.totalStock),
            minimum: formatNumber(item.minimumStock),
            status: item.status === "critical" ? "Crítico" : "Atención",
          }))
        : [
            {
              label: "Sin productos en alerta",
              stock: "-",
              minimum: "-",
              status: "OK",
            },
          ],
    audienceSeries,
    inventoryStatus: inventoryStatusSummary,
    inventoryHealthPercent: stockHealth,
    categoryBreakdown: categoryBreakdownExport,
    movements: movementsExport,
    reports: reportsExport,
    stockHighlight,
    locationOverview: locationOverviewExport,
    conversionRateLabel,
    notes: (
      <p>
        Resumen generado automáticamente a partir de {formatNumber(trafficTotal)} interacciones registradas en el periodo seleccionado.
      </p>
    ),
  }


  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />

      <main
        id="dashboard-export-area"
        className="container mx-auto max-w-[1180px] space-y-8 px-4 py-10 sm:px-6"
      >
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Panel ejecutivo</p>
              <h1 className="text-[34px] font-semibold leading-tight text-slate-900 md:text-[38px]">Operaciones de inventario</h1>
              <p className="text-sm text-slate-500">
                Observa la salud del inventario, el desempeño del probador virtual y las alertas clave en un solo lugar.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 text-xs text-slate-500 md:items-end">
              <span className="rounded-full bg-white px-4 py-1.5 shadow-sm">Actualizado {formatDateTime(overview.context.generatedAt)}</span>
              <DashboardExportButton exportData={exportData} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white px-4 py-1.5 shadow-sm">
              Periodo: {formatDateRange(overview.context.filters.from, overview.context.filters.to)}
            </span>
            {activeCategory ? (
              <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-indigo-600 shadow-sm">Categoría: {activeCategory}</span>
            ) : null}
            {activeLocation ? (
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-emerald-600 shadow-sm">Ubicación: {activeLocation}</span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full bg-rose-50 px-4 py-1.5 text-rose-600 shadow-sm">{statusLabel}</span>
            ) : null}
          </div>
        </header>

        <DashboardFilters filters={overview.context.filters} availableFilters={overview.context.availableFilters} />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => {
            const Icon = card.icon
            const isPositive = card.deltaValue >= 0
            const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
            const trendClasses = isPositive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"

            return (
              <Card key={card.id} className={`${panelClass} overflow-hidden p-6`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${trendClasses}`}>
                    <TrendIcon className="h-3.5 w-3.5" />
                    {card.delta}
                  </span>
                </div>
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
              </Card>
            )
          })}
        </section>

        <DashboardVisuals
          panelClass={panelClass}
          demandTrendData={demandTrendData}
          productTrafficData={productTrafficData}
          totalProducts={overview.metrics.totalProducts}
          lowStockProducts={overview.metrics.lowStockProducts}
          criticalAlerts={criticalAlerts}
          trafficPalette={trafficColors}
          tryOnSummary={tryOnSummary}
        />

        <section className="grid gap-6 xl:grid-cols-12">
          <Card
            className={`${panelClass} xl:col-span-7`}
            style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e0cdfc 100%)" }}
          >
            <CardHeader className="flex flex-col gap-2 border-b border-slate-100/80 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Flujo de inventario</CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Entradas y salidas del periodo actual.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  {!hasInventoryFlow ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-600">Datos de referencia</span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Entradas {formatNumber(inboundTotal)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-rose-500">
                    <span className="h-2 w-2 rounded-full bg-rose-400" />
                    Salidas {formatNumber(outboundTotal)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-4">
              <InventoryFlowChart data={inventoryFlowData} />
            </CardContent>
          </Card>

          <Card
            className={`${panelClass} xl:col-span-5`}
            style={{ background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" }}
          >
            <CardHeader className="flex flex-col gap-2 border-b border-slate-100/80 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Probador virtual</CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Conversión acumulada del periodo.
                  </CardDescription>
                </div>
                <span className="text-sm font-semibold text-slate-900">{formatPercentage(conversionRate)} conversión</span>
              </div>
              {!hasTryOnTrend ? (
                <p className="text-xs text-amber-500">Mostramos datos de referencia hasta recibir sesiones reales.</p>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 pt-4">
              <TryOnTrendChart data={tryOnTrendData} />
              <div className="grid gap-4 sm:grid-cols-2">
                {quickTryOnStats.map((stat) => (
                  <div key={stat.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card
          className={`${panelClass} p-6`}
          style={{ background: "linear-gradient(135deg, #ffe0f2 0%, #ffcfe7 100%)" }}
        >
          <div className="flex flex-col gap-2 border-b border-slate-100 pb-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Comportamiento de demanda</p>
                <p className="text-xs text-slate-500">Comparte la relación views/try-ons de tu catálogo.</p>
              </div>
              <span className="text-xs font-semibold text-indigo-500">Análisis inteligente</span>
            </div>
          </div>
          <div className="pt-4 space-y-2">
            <DemandTrendWidget data={demandTrendData} />
            {!hasDemandTrend ? (
              <p className="text-xs text-amber-500">Referencia visual mostrada mientras se recopilan interacciones reales.</p>
            ) : null}
          </div>
        </Card>

        <section className="grid gap-6 xl:grid-cols-12">
          <Card
            className={`${panelClass} xl:col-span-7`}
            style={{ background: "linear-gradient(135deg, #fff4d7 0%, #ffe3a3 100%)" }}
          >
            <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Top productos destacados</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Ranking por interacción total en el probador virtual.
                </CardDescription>
              </div>
              <List className="h-5 w-5 text-slate-400" />
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-0">
              {overview.topProducts.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-500">
                  No hay productos con interacción en este periodo.
                </div>
              ) : (
                overview.topProducts.map((product, index) => {
                  const total = product.views + product.tryons + product.favorites + product.shares
                  const progress = Math.round((total / topProductPeak) * 100)

                  return (
                    <div key={product.productId} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">#{index + 1}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{product.productName}</p>
                          <p className="text-xs text-slate-500">SKU: {product.sku ?? "Sin SKU"}</p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-600">
                          {formatNumber(total)} interacciones
                        </Badge>
                      </div>
                        <div className="mt-4 grid gap-3 text-xs text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                        <span>Vistas {formatNumber(product.views)}</span>
                        <span>Try-ons {formatNumber(product.tryons)}</span>
                        <span>Favoritos {formatNumber(product.favorites)}</span>
                        <span>Shares {formatNumber(product.shares)}</span>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card
            className={`${panelClass} xl:col-span-5`}
            style={{ background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)" }}
          >
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Insights de inventario</CardTitle>
              <CardDescription className="text-sm text-slate-500">
                Estado de stock, categorías activas y tráfico a detalle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 pt-0">
              <div className="rounded-2xl bg-slate-50/80 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Salud del inventario</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold text-slate-900">{stockHealth.toFixed(0)}%</span>
                  <span className="text-xs text-slate-500">Cumplimiento objetivo</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/70">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${stockHealth}%` }} />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categorías destacadas</p>
                {categoriesPreview.length === 0 ? (
                  <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-6 text-sm text-slate-500">
                    No hay categorías con stock disponible en este filtro.
                  </div>
                ) : (
                  categoriesPreview.map((category) => (
                      <div key={category.id} className="flex flex-col gap-1 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <span>{category.nombre}</span>
                      <span className="font-semibold text-slate-900">{formatNumber(category.productCount)} uds</span>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tráfico del catálogo</p>
                {!hasProductTraffic ? (
                  <p className="text-xs text-amber-500">Distribución estimada mientras llega tráfico real.</p>
                ) : null}
                {productTrafficData.map((item) => {
                  const palette = trafficColors[item.type] ?? { bg: "bg-slate-100", text: "text-slate-600" }
                  const share = trafficTotal > 0 ? Math.round((item.count / trafficTotal) * 100) : 0

                  return (
                    <div key={item.type} className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${palette.bg} ${palette.text}`}>
                        <span className="h-2 w-2 rounded-full bg-current" />
                        {item.label}
                      </span>
                      <span className="font-semibold text-slate-900">{formatNumber(item.count)} · {share}%</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <Card
            className={`${panelClass} xl:col-span-12`}
            style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e0cdfc 100%)" }}
          >
            <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Alertas de stock</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  {formatNumber(criticalAlerts)} productos con criticidad alta.
                </CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-rose-400" />
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-0">
              {lowStockPreview.length === 0 ? (
                <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-rose-200 bg-rose-50/50 text-sm text-slate-500">
                  No hay alertas activas para los filtros actuales.
                </div>
              ) : (
                lowStockPreview.map((item) => (
                  <div key={item.productId} className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-xs text-slate-500">SKU: {item.sku ?? "Sin SKU"}</p>
                      </div>
                      <Badge variant={item.status === "critical" ? "destructive" : "outline"} className="uppercase tracking-wide">
                        {item.status === "critical" ? "Crítico" : "Alerta"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(item.totalStock)}</p>
                        <p>Stock actual</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(item.minimumStock)}</p>
                        <p>Mínimo requerido</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatNumber(item.totalStock - item.minimumStock)}</p>
                        <p>Gap</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {item.locations.length === 0 ? (
                        <span className="rounded-full bg-white/70 px-3 py-1 text-slate-500">Sin ubicaciones registradas</span>
                      ) : (
                        item.locations.map((location) => (
                          <span key={location.id} className="rounded-full bg-white px-3 py-1 text-slate-600">
                            {location.location}: {formatNumber(location.quantity)} uds
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-12">
          <Card
            className={`${panelClass} xl:col-span-7`}
            style={{ background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)" }}
          >
            <CardHeader className="p-6 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900">Panorama por bodega</CardTitle>
                  <CardDescription className="text-sm text-slate-500">
                    Inventario consolidado y alertas por ubicación.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full border-slate-200 text-xs text-slate-600">
                  Logística
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6 pt-0">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Valor inventario</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(totalLocationValue)}</p>
                  <p className="text-xs text-slate-500">{activeLocations} bodegas activas</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock total</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(totalLocationUnits)} uds</p>
                  <p className="text-xs text-slate-500">{formatNumber(overview.metrics.totalProducts)} productos únicos</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock por bodega</p>
                {locationDistribution.length === 0 ? (
                  <div className="flex min-h-[140px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-500">
                    No hay ubicaciones con inventario registrado en este periodo.
                  </div>
                ) : (
                  locationDistribution.map((location) => (
                    <div key={location.label} className="space-y-2">
                      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                        <span className="font-medium text-slate-900">{location.label}</span>
                        <span>{location.formattedUnits} uds · {Math.min(location.percent, 100)}%</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="rounded-full bg-white/70 px-2.5 py-1">{location.formattedProducts} productos</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(location.percent, 100)}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Alertas activas</p>
                {locationAlerts.length === 0 ? (
                  <p className="text-sm text-slate-500">No hay alertas activas por bodega.</p>
                ) : (
                  locationAlerts.map((item) => (
                    <div
                      key={item.label}
                      className="flex flex-col gap-1 rounded-2xl border border-white/70 bg-white/70 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-medium text-slate-900">{item.label}</span>
                      <span className="text-xs text-amber-600">{item.low} en seguimiento</span>
                      <span className="text-xs font-semibold text-rose-600">{item.critical} críticas</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${panelClass} xl:col-span-5`}
            style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}
            id="reportes"
          >
            <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">Reportes recientes</CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Historial generado desde Supabase Reports.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full bg-white/80 text-slate-700">
                Últimos {reportsPreview.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6 pt-0">
              {reportsPreview.length === 0 ? (
                <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
                  No se han generado reportes todavía.
                </div>
              ) : (
                reportsPreview.map((report) => (
                  <div key={report.id} className="rounded-2xl border border-slate-100 bg-white/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold capitalize text-slate-900">{report.type}</span>
                      <span className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</span>
                    </div>
                    {report.summary ? (
                      <p className="mt-2 text-sm text-slate-600">{report.summary}</p>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">Sin descripción.</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
