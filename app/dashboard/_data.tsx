import type { LucideIcon } from "lucide-react"
import { Banknote, Boxes, Eye } from "lucide-react"

import type { DashboardExportData } from "@/components/dashboard/dashboard-export-sheet"
import type { DashboardFiltersInput, DemandTrendPoint, InventoryFlowPoint, ProductTrafficItem, TryOnTrendPoint } from "@/lib/types/analytics"
import { fetchDashboardOverview } from "@/lib/services/dashboard"
import { fetchReportsOverview } from "@/lib/services/reports"

const COMMON_TIMEZONE: Intl.DateTimeFormatOptions["timeZone"] = "America/Bogota"

export const DASHBOARD_SECTION_ITEMS = [
  { id: "resumen", label: "Resumen", href: "/dashboard" },
  { id: "analytics", label: "Analítica", href: "/dashboard/analytics" },
  { id: "probador", label: "Probador", href: "/dashboard/probador" },
  { id: "inventario", label: "Inventario", href: "/dashboard/inventario" },
  { id: "demanda", label: "Demanda", href: "/dashboard/demanda" },
  { id: "catalogo", label: "Catálogo", href: "/dashboard/catalogo" },
  { id: "alertas", label: "Alertas", href: "/dashboard/alertas" },
  { id: "operaciones", label: "Operaciones", href: "/dashboard/operaciones" },
] as const

export type DashboardSectionLink = typeof DASHBOARD_SECTION_ITEMS[number]
export type DashboardSectionId = DashboardSectionLink["id"]

export type DashboardPageSearchParams = Record<string, string | string[] | undefined>

export type DashboardPageProps = {
  searchParams?: DashboardPageSearchParams | Promise<DashboardPageSearchParams>
}

export const formatNumber = (value: number) => new Intl.NumberFormat("es-CO").format(value)

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)

export const formatPercentage = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : "0.0"}%`

export const formatDelta = (value: number) => {
  if (!Number.isFinite(value)) return "0.00%"
  const sign = value >= 0 ? "+" : ""
  return `${sign}${value.toFixed(2)}%`
}

export const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—"
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds % 60)
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: COMMON_TIMEZONE,
  }).format(new Date(value))

export const formatShortDate = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
  }).format(date)
}

export const formatDateRange = (from: string, to: string) => {
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

const toSingleValue = (value?: string | string[]): string | undefined => {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value ?? undefined
}

export const parseFiltersFromSearchParams = (searchParams?: DashboardPageSearchParams): DashboardFiltersInput => {
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

export type OverviewCardDefinition = {
  id: "inventory-value" | "available-units" | "tryon"
  label: string
  value: string
  helper: string
  delta: string
  deltaValue: number
  icon: LucideIcon
  accent: string
}

export type SummaryHighlight = {
  id: string
  label: string
  value: string
  helper: string
  variant: "primary" | "success" | "danger"
}

export type TrafficPalette = Record<string, { bg: string; text: string }>

export type DashboardContext = {
  filters: DashboardFiltersInput
  overview: Awaited<ReturnType<typeof fetchDashboardOverview>>
  reportsOverview: Awaited<ReturnType<typeof fetchReportsOverview>>
  panelClass: string
  sectionNavItems: readonly DashboardSectionLink[]
  overviewCards: readonly OverviewCardDefinition[]
  resumenHighlights: readonly SummaryHighlight[]
  inventoryHighlights: readonly OverviewCardDefinition[]
  analyticsHighlights: readonly OverviewCardDefinition[]
  probadorHighlights: readonly OverviewCardDefinition[]
  quickTryOnStats: { id: string; label: string; value: string }[]
  trafficColors: TrafficPalette
  demandTrendData: DemandTrendPoint[]
  productTrafficData: ProductTrafficItem[]
  tryOnSummary: Awaited<ReturnType<typeof fetchDashboardOverview>>["tryOn"]["summary"]
  hasInventoryFlow: boolean
  inventoryFlowData: InventoryFlowPoint[]
  inboundTotal: number
  outboundTotal: number
  hasTryOnTrend: boolean
  conversionRate: number
  conversionRateLabel: string
  tryOnTrendData: TryOnTrendPoint[]
  hasDemandTrend: boolean
  hasProductTraffic: boolean
  stockHealth: number
  trafficTotal: number
  criticalAlerts: number
  topProductPeak: number
  categoriesPreview: Awaited<ReturnType<typeof fetchDashboardOverview>>["categories"]
  lowStockPreview: Awaited<ReturnType<typeof fetchDashboardOverview>>["inventory"]["lowStock"]
  inventoryStatusSummary: { label: string; value: number }[]
  locationDistribution: {
    label: string
    units: number
    percent: number
    formattedUnits: string
    productCount: number
    formattedProducts: string
  }[]
  locationAlerts: {
    label: string
    low: number
    critical: number
  }[]
  stockHighlight?: {
    product: string
    sku?: string
    status: string
    stock: string
    minimum: string
    location?: string
  }
  totalLocationValue: number
  activeLocations: number
  totalLocationUnits: number
  movementsPreview: Awaited<ReturnType<typeof fetchDashboardOverview>>["inventory"]["movements"]
  reportsPreview: Awaited<ReturnType<typeof fetchReportsOverview>>["recentReports"]
  exportData: DashboardExportData
  activeCategory: string | null
  activeLocation: string | null
  statusLabel: string | null
  periodLabel: string
  updatedLabel: string
}

export const loadDashboardContext = async (
  searchParams?: DashboardPageSearchParams | Promise<DashboardPageSearchParams>,
): Promise<DashboardContext> => {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
  const filters = parseFiltersFromSearchParams(resolvedSearchParams)

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
  const conversionRateLabel = formatPercentage(conversionRate)

  const stockHealth = overview.metrics.totalProducts > 0
    ? Math.max(0, Math.min(100, Math.round(((overview.metrics.totalProducts - overview.metrics.lowStockProducts) / overview.metrics.totalProducts) * 100)))
    : 100

  const inboundTotal = inventoryFlowData.reduce((acc, point) => acc + point.inbound, 0)
  const outboundTotal = inventoryFlowData.reduce((acc, point) => acc + point.outbound, 0)
  const turnoverRate = overview.metrics.totalStockUnits > 0 ? (outboundTotal / overview.metrics.totalStockUnits) * 100 : 0
  const stockChangeRate = overview.metrics.totalStockUnits > 0 ? ((inboundTotal - outboundTotal) / overview.metrics.totalStockUnits) * 100 : 0
  const criticalAlerts = overview.inventory.lowStock.filter((item) => item.status === "critical").length
  const topProductPeak = overview.topProducts.reduce((acc, product) => {
    const total = product.views + product.tryons + product.favorites + product.shares
    return total > acc ? total : acc
  }, 0) || 1

  const lowStockPreview = overview.inventory.lowStock.slice(0, 4)
  const categoriesPreview = overview.categories.slice(0, 5)
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

  const overviewCards: OverviewCardDefinition[] = [
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
  ]

  const inventoryHighlights = overviewCards.filter((card) => card.id === "inventory-value" || card.id === "available-units")
  const probadorHighlights = overviewCards.filter((card) => card.id === "tryon")
  const analyticsHighlights = [...probadorHighlights]

  const resumenHighlights: SummaryHighlight[] = [
    {
      id: "traffic-total",
      label: "Interacciones registradas",
      value: formatNumber(trafficTotal),
      helper: "Vistas + try-ons del periodo",
      variant: "primary",
    },
    {
      id: "conversion-rate",
      label: "Tasa de conversión",
      value: conversionRateLabel,
      helper: "Relación try-ons vs vistas",
      variant: "success",
    },
    {
      id: "critical-alerts",
      label: "Alertas críticas activas",
      value: formatNumber(criticalAlerts),
      helper: "Productos con stock crítico",
      variant: "danger",
    },
  ]

  const quickTryOnStats = [
    { id: "sessions", label: "Sesiones", value: formatNumber(tryOnSummary.sessions) },
    { id: "items", label: "Items escaneados", value: formatNumber(tryOnSummary.items) },
    { id: "duration", label: "Duración promedio", value: formatDuration(tryOnSummary.averageDurationSeconds) },
    { id: "unique", label: "Productos únicos", value: formatNumber(tryOnSummary.uniqueProducts) },
  ]

  const trafficColors: TrafficPalette = {
    view: { bg: "bg-indigo-50", text: "text-indigo-600" },
    tryon: { bg: "bg-emerald-50", text: "text-emerald-600" },
    favorite: { bg: "bg-rose-50", text: "text-rose-600" },
    share: { bg: "bg-amber-50", text: "text-amber-600" },
  }

  const exportBadges: string[] = []
  const activeCategory = overview.context.filters.categoryId
    ? overview.context.availableFilters.categories.find((category) => category.id === overview.context.filters.categoryId)?.nombre ?? "Categoría filtrada"
    : null
  const activeLocation = overview.context.filters.location
  const statusLabel = overview.context.filters.stockStatus !== "all"
    ? overview.context.filters.stockStatus === "critical"
      ? "Alertas críticas"
      : "Alertas en seguimiento"
    : null

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

  const movementsPreview = overview.inventory.movements.slice(0, 6)
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
    locationOverview: {
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
    },
    conversionRateLabel,
    notes: (
      <p>
        Resumen generado automáticamente a partir de {formatNumber(trafficTotal)} interacciones registradas en el periodo seleccionado.
      </p>
    ),
  }

  return {
    filters,
    overview,
    reportsOverview,
    panelClass,
    sectionNavItems: DASHBOARD_SECTION_ITEMS,
    overviewCards,
    resumenHighlights,
    inventoryHighlights,
    analyticsHighlights,
    probadorHighlights,
    quickTryOnStats,
    trafficColors,
    demandTrendData,
    productTrafficData,
    tryOnSummary,
    hasInventoryFlow,
    inventoryFlowData,
    inboundTotal,
    outboundTotal,
    hasTryOnTrend,
    conversionRate,
    conversionRateLabel,
    tryOnTrendData,
    hasDemandTrend,
    hasProductTraffic,
    stockHealth,
    trafficTotal,
    criticalAlerts,
    topProductPeak,
    categoriesPreview,
    lowStockPreview,
    inventoryStatusSummary,
    locationDistribution,
    locationAlerts,
    stockHighlight,
    totalLocationValue,
    activeLocations,
    totalLocationUnits,
    movementsPreview,
    reportsPreview,
    exportData,
    activeCategory,
    activeLocation,
    statusLabel,
    periodLabel: formatDateRange(overview.context.filters.from, overview.context.filters.to),
    updatedLabel: formatDateTime(overview.context.generatedAt),
  }
}
