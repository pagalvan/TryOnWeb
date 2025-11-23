import { AlertTriangle, ArrowDownRight, ArrowUpRight, List } from "lucide-react"

import type { DashboardContext } from "@/app/dashboard/_data"
import { formatCurrency, formatDateTime, formatNumber } from "@/app/dashboard/_data"
import { DemandTrendWidget } from "@/components/dashboard/demand-trend-widget"
import { DashboardVisuals } from "@/components/dashboard/dashboard-visuals"
import { InventoryFeedbackCard } from "@/components/dashboard/inventory-feedback-card"
import { InventoryFlowChart } from "@/components/dashboard/inventory-flow-chart"
import { TryOnTrendChart } from "@/components/dashboard/tryon-trend-chart"
import { TryOnAudienceChart } from "@/components/dashboard/tryon-audience-chart"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type SectionProps = {
  context: DashboardContext
}

export function ResumenSection({ context }: SectionProps) {
  const { overviewCards, panelClass } = context

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {overviewCards.map((card) => {
        const Icon = card.icon
        const isPositive = card.deltaValue >= 0
        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight
        const trendClasses = isPositive ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"

        return (
          <Card
            key={card.id}
            className={`${panelClass} overflow-hidden rounded-3xl border border-white/60 bg-gradient-to-b from-white/95 via-white/90 to-slate-50/80 p-6 shadow-[0_12px_25px_rgba(15,23,42,0.08)] backdrop-blur-xl`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-inner`}> 
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${trendClasses} shadow-sm`}
              >
                <TrendIcon className="h-3.5 w-3.5" />
                {card.delta}
              </span>
            </div>
            <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.4em] text-slate-400">
              {card.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-2 text-sm text-slate-500">{card.helper}</p>
          </Card>
        )
      })}
    </section>
  )
}

export function AnalyticsSection({ context }: SectionProps) {
  const { panelClass, demandTrendData, productTrafficData, tryOnSummary } = context

  return (
    <section className="space-y-6">
      <DashboardVisuals
        panelClass={panelClass}
        demandTrendData={demandTrendData}
        productTrafficData={productTrafficData}
        tryOnSummary={tryOnSummary}
      />
    </section>
  )
}

export function InventarioSection({ context }: SectionProps) {
  const {
    panelClass,
    hasInventoryFlow,
    inventoryFlowData,
    inboundTotal,
    outboundTotal,
    stockHealth,
    inventoryStatusSummary,
    stockHighlight,
  } = context

  const inventoryAvailable = inventoryStatusSummary.find((item) => item.label === "Disponible")?.value ?? 0
  const inventoryWarning = inventoryStatusSummary.find((item) => item.label === "Atención")?.value ?? 0
  const inventoryCritical = inventoryStatusSummary.find((item) => item.label === "Crítico")?.value ?? 0
  const inventoryFeedbackData = [
    { key: "positive" as const, name: "Disponible", value: inventoryAvailable },
    { key: "neutral" as const, name: "Atención", value: inventoryWarning },
    { key: "negative" as const, name: "Crítico", value: inventoryCritical },
  ]
  const inventoryFeedbackTotal = inventoryFeedbackData.reduce((acc, item) => acc + item.value, 0)

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-7`}
        style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e0cdfc 100%)" }}
      >
        <CardHeader className="flex flex-col gap-2 border-b border-slate-100/80 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Flujo de inventario</CardTitle>
              <CardDescription className="text-sm text-slate-500">Entradas y salidas del periodo actual.</CardDescription>
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
        style={{ background: "linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Estado del inventario</CardTitle>
          <CardDescription className="text-sm text-slate-500">Salud global y niveles por criticidad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 px-6 pb-6 pt-0">
          <div className="rounded-2xl bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Salud general</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-slate-900">{stockHealth.toFixed(0)}%</span>
              <span className="text-xs text-slate-500">Cumplimiento de objetivo</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${stockHealth}%` }} />
            </div>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            {inventoryStatusSummary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{formatNumber(item.value)}</p>
              </div>
            ))}
          </div>

          {stockHighlight ? (
            <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Prioridad</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{stockHighlight.product}</p>
              <p className="text-xs text-slate-500">SKU: {stockHighlight.sku ?? "Sin SKU"}</p>
              <div className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                <span>Stock actual {stockHighlight.stock}</span>
                <span>Mínimo {stockHighlight.minimum}</span>
                {stockHighlight.location ? <span className="sm:col-span-2">{stockHighlight.location}</span> : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <InventoryFeedbackCard panelClass={panelClass} data={inventoryFeedbackData} total={inventoryFeedbackTotal} />
    </section>
  )
}

export function DemandaSection({ context }: SectionProps) {
  const {
    panelClass,
    demandTrendData,
    hasDemandTrend,
  } = context

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-12`}
        style={{ background: "linear-gradient(135deg, #ffe0f2 0%, #ffcfe7 100%)" }}
      >
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Comportamiento de demanda</CardTitle>
            <CardDescription className="text-sm text-slate-500">Comparte la relación views/try-ons del catálogo.</CardDescription>
          </div>
          <span className="text-xs font-semibold text-indigo-500">Análisis inteligente</span>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <DemandTrendWidget data={demandTrendData} />
          {!hasDemandTrend ? (
            <p className="text-xs text-amber-500">Referencia visual mostrada mientras se recopilan interacciones reales.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}

export function CatalogoSection({ context }: SectionProps) {
  const {
    panelClass,
    overview,
    topProductPeak,
    categoriesPreview,
    productTrafficData,
    hasProductTraffic,
    trafficColors,
    trafficTotal,
  } = context

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-12`}
        style={{ background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Tráfico del catálogo</CardTitle>
          <CardDescription className="text-sm text-slate-500">Distribución de interacciones por tipo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-0">
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
        </CardContent>
      </Card>

      <Card
        className={`${panelClass} xl:col-span-7`}
        style={{ background: "linear-gradient(135deg, #fff4d7 0%, #ffe3a3 100%)" }}
      >
        <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Top productos destacados</CardTitle>
            <CardDescription className="text-sm text-slate-500">Ranking por interacción total en el probador virtual.</CardDescription>
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
        style={{ background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Categorías activas</CardTitle>
          <CardDescription className="text-sm text-slate-500">Composición del catálogo en el periodo actual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 pt-0">
          {categoriesPreview.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-500">
              No hay categorías con stock disponible en este filtro.
            </div>
          ) : (
            categoriesPreview.map((category) => (
              <div key={category.id} className="flex flex-col gap-1 rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span>{category.nombre}</span>
                <span className="font-semibold text-slate-900">{formatNumber(category.productCount ?? 0)} uds</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function ProbadorSection({ context }: SectionProps) {
  const {
    panelClass,
    conversionRateLabel,
    tryOnTrendData,
    hasTryOnTrend,
    quickTryOnStats,
    demandTrendData,
  } = context

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-7 p-6`}
        style={{ background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)" }}
      >
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Desempeño del probador</CardTitle>
            <CardDescription className="text-sm text-slate-500">Tendencia de sesiones e interacción por semana.</CardDescription>
          </div>
          <span className="text-sm font-semibold text-slate-900">{conversionRateLabel} conversión</span>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <TryOnTrendChart data={tryOnTrendData} />
          {!hasTryOnTrend ? (
            <p className="text-xs text-amber-500">Mostramos datos de referencia hasta recibir sesiones reales.</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickTryOnStats.map((stat) => (
              <div key={stat.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card
        className={`${panelClass} xl:col-span-5`}
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
          <TryOnAudienceChart data={demandTrendData} />
        </CardContent>
      </Card>
    </section>
  )
}

export function AlertasSection({ context }: SectionProps) {
  const { panelClass, lowStockPreview, criticalAlerts, locationAlerts, stockHighlight } = context

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-8`}
        style={{ background: "linear-gradient(135deg, #f3e8ff 0%, #e0cdfc 100%)" }}
      >
        <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Alertas de stock</CardTitle>
            <CardDescription className="text-sm text-slate-500">{formatNumber(criticalAlerts)} productos con criticidad alta.</CardDescription>
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

      <Card
        className={`${panelClass} xl:col-span-4`}
        style={{ background: "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Resumen de alertas</CardTitle>
          <CardDescription className="text-sm text-slate-500">Ubicaciones y productos más sensibles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-0">
          {stockHighlight ? (
            <div className="rounded-2xl border border-white/70 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">Prioridad inmediata</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{stockHighlight.product}</p>
              <p className="text-xs text-slate-500">{stockHighlight.location ?? "Sin ubicación detallada"}</p>
            </div>
          ) : null}

          {locationAlerts.length === 0 ? (
            <p className="text-sm text-slate-500">Sin alertas distribuidas por ubicación.</p>
          ) : (
            locationAlerts.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">{item.label}</span>
                  <span className="text-xs font-semibold text-rose-600">{item.critical} críticas</span>
                </div>
                <p className="mt-1 text-xs text-amber-600">{item.low} en seguimiento</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  )
}

export function OperacionesSection({ context }: SectionProps) {
  const {
    panelClass,
    totalLocationValue,
    activeLocations,
    totalLocationUnits,
    overview,
    locationDistribution,
    movementsPreview,
    reportsPreview,
  } = context

  return (
    <section className="grid gap-6 xl:grid-cols-12">
      <Card
        className={`${panelClass} xl:col-span-7`}
        style={{ background: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">Panorama por bodega</CardTitle>
              <CardDescription className="text-sm text-slate-500">Inventario consolidado por ubicación.</CardDescription>
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
        </CardContent>
      </Card>

      <Card
        className={`${panelClass} xl:col-span-5`}
        style={{ background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)" }}
      >
        <CardHeader className="flex flex-col gap-3 p-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">Reportes recientes</CardTitle>
            <CardDescription className="text-sm text-slate-500">Historial generado desde Supabase Reports.</CardDescription>
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

      <Card
        className={`${panelClass} xl:col-span-8 xl:col-start-3`}
        style={{ background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)" }}
      >
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-lg font-semibold text-slate-900">Movimientos recientes</CardTitle>
          <CardDescription className="text-sm text-slate-500">Entradas y salidas confirmadas en las últimas actualizaciones.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 pt-0">
          {movementsPreview.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-500">
              No se registran movimientos en el periodo seleccionado.
            </div>
          ) : (
            movementsPreview.map((movement, index) => {
              const rawType = typeof movement.type === "string" ? movement.type.toLowerCase() : ""
              const direction = rawType.includes("in") ? "in" : "out"
              const DirectionIcon = direction === "in" ? ArrowUpRight : ArrowDownRight
              const badgeClasses = direction === "in" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              const numericQuantity = typeof movement.quantity === "number" ? movement.quantity : Number(movement.quantity)
              const formattedQuantity = Number.isFinite(numericQuantity) ? formatNumber(numericQuantity) : `${movement.quantity ?? 0}`
              const timestampLabel = typeof movement.timestamp === "string" ? formatDateTime(movement.timestamp) : "Sin fecha"

              return (
                <div key={movement.id ?? index} className="rounded-2xl border border-white/70 bg-white/70 p-4 text-sm text-slate-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900">{movement.motive ?? movement.type ?? "Movimiento"}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${badgeClasses}`}>
                      <DirectionIcon className="h-3.5 w-3.5" />
                      {direction === "in" ? "Entrada" : "Salida"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>{timestampLabel}</span>
                    {movement.location ? <span>{movement.location}</span> : null}
                    <span className="font-semibold text-slate-900">{direction === "in" ? "+" : "-"}{formattedQuantity} uds</span>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </section>
  )
}
