import type { ReactNode } from "react"

type DashboardExportCard = {
  id: string
  label: string
  value: string
  helper?: string
  delta?: string
  deltaTrend?: "up" | "down"
  periodLabel?: string
  source?: string
  progress?: number
  sparkline?: number[]
}

type SeriesPoint = {
  label: string
  value: number
}

type DualSeriesPoint = {
  label: string
  primary: number
  secondary: number
}

type MovementExport = {
  id: string
  description: string
  date: string
  quantity: string
  direction: "in" | "out"
}

type ReportExport = {
  id: string
  title: string
  date: string
  summary?: string
}

type LocationOverview = {
  inventoryValue: string
  totalUnits: string
  activeLocations: number
  distribution: Array<{ label: string; units: string; percent: number; products: string }>
  alerts: Array<{ label: string; low: number; critical: number; budget: number }>
}

type StockHighlight = {
  product: string
  sku?: string
  status: string
  stock: string
  minimum: string
  location?: string
}

export type DashboardExportData = {
  title: string
  subtitle: string
  generatedLabel: string
  periodLabel: string
  badges: string[]
  cards: DashboardExportCard[]
  quickStats: Array<{ id: string; label: string; value: string }>
  traffic: Array<{ label: string; value: string; count: number }>
  demandTrend: Array<{ label: string; sessions: string; rawSessions: number }>
  inventoryFlow: Array<{ label: string; inbound: number; outbound: number }>
  tryOnTrend: Array<{ label: string; sessions: number; items: number }>
  topProducts: Array<{ label: string; tryons: string; favorites: string; shares: string; totalInteractions: number }>
  lowStock: Array<{ label: string; stock: string; minimum: string; status: string }>
  audienceSeries: Array<{ label: string; views: number; tryons: number }>
  inventoryStatus: Array<{ label: string; value: number }>
  inventoryHealthPercent: number
  categoryBreakdown: Array<{ label: string; value: number }>
  movements: MovementExport[]
  reports: ReportExport[]
  stockHighlight?: StockHighlight
  locationOverview: LocationOverview
  conversionRateLabel: string
  notes?: ReactNode
}

type DashboardExportSheetProps = {
  data: DashboardExportData
}

export function DashboardExportSheet({ data }: DashboardExportSheetProps) {
  const {
    title,
    subtitle,
    generatedLabel,
    periodLabel,
    badges,
    cards,
    quickStats,
    traffic,
    inventoryFlow,
    tryOnTrend,
    topProducts,
    lowStock,
    audienceSeries,
    inventoryStatus,
    inventoryHealthPercent,
    categoryBreakdown,
    movements,
    reports,
    stockHighlight,
    locationOverview,
    conversionRateLabel,
    notes,
  } = data
  const trafficTotal = Math.max(traffic.reduce((acc, item) => acc + item.count, 0), 1)
  const statusTotal = Math.max(inventoryStatus.reduce((acc, item) => acc + item.value, 0), 1)
  const categoryTotal = Math.max(categoryBreakdown.reduce((acc, item) => acc + item.value, 0), 1)
  const topProductPeak = Math.max(...topProducts.map((product) => product.totalInteractions), 1)

  return (
    <div className="w-[1200px] bg-[#f5f7ff] p-10 text-slate-900">
      <div className="space-y-3 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{subtitle}</p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{periodLabel}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-600">Actualizado</p>
            <p>{generatedLabel}</p>
          </div>
        </div>
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1 text-xs font-medium text-slate-600">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.id} className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
              <span>{card.periodLabel ?? "Mes en curso"}</span>
              {card.source ? <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] tracking-[0.2em] text-slate-500">{card.source}</span> : null}
            </div>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
              {card.delta ? (
                <span className={`text-sm font-semibold ${card.deltaTrend === "down" ? "text-rose-500" : "text-emerald-600"}`}>
                  {card.delta}
                </span>
              ) : null}
            </div>
            {card.helper ? <p className="text-xs text-slate-500">{card.helper}</p> : null}
            {typeof card.progress === "number" ? (
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${card.deltaTrend === "down" ? "bg-rose-400" : "bg-indigo-500"}`}
                  style={{ width: `${Math.max(0, Math.min(100, card.progress))}%` }}
                />
              </div>
            ) : null}
            {card.sparkline && card.sparkline.length > 1 ? (
              <div className="mt-4">
                <SparklineChart values={card.sparkline} trend={card.deltaTrend} />
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="mt-6">
        <AudienceCard
          title="Audiencia del probador"
          subtitle="Curvas comparativas de views y try-ons."
          badge="Semana móvil"
          series={audienceSeries.map((point) => ({ label: point.label, primary: point.views, secondary: point.tryons }))}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <FeedbackCard
          title="Feedback inventario"
          subtitle="Estado global de existencias por criticidad."
          statuses={inventoryStatus}
          total={statusTotal}
        />
        <ChannelCard traffic={traffic} total={trafficTotal} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <LargeChartCard
          title="Flujo de inventario"
          description="Entradas y salidas del periodo actual."
          primaryLabel="Entradas"
          secondaryLabel="Salidas"
          points={inventoryFlow.map((point) => ({ label: point.label, primary: point.inbound, secondary: point.outbound }))}
        />
        <TryOnCard
          conversionLabel={conversionRateLabel}
          series={tryOnTrend.map((point) => ({ label: point.label, value: point.sessions }))}
          quickStats={quickStats}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <TopProductsCard products={topProducts} peak={topProductPeak} />
        <InventoryInsightsCard
          healthPercent={inventoryHealthPercent}
          categoryBreakdown={categoryBreakdown}
          categoryTotal={categoryTotal}
          traffic={traffic}
          trafficTotal={trafficTotal}
        />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <StockAlertsCard highlight={stockHighlight} lowStock={lowStock} />
        <MovementsCard movements={movements} />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <LocationPanoramaCard overview={locationOverview} />
        <ReportsCard reports={reports} />
      </section>

      {notes ? <div className="mt-6 text-xs text-slate-500">{notes}</div> : null}
    </div>
  )
}

type AudienceCardProps = {
  title: string
  subtitle: string
  badge?: string
  series: DualSeriesPoint[]
}

function AudienceCard({ title, subtitle, badge, series }: AudienceCardProps) {
  const formatter = new Intl.NumberFormat("es-CO")
  const latest = series[series.length - 1]
  const views = latest ? formatter.format(Math.round(latest.primary)) : "0"
  const tryons = latest ? formatter.format(Math.round(latest.secondary)) : "0"

  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#ddeafe] to-[#c7dfff] p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        {badge ? <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]">{badge}</span> : null}
      </div>
      <div className="mt-6 grid gap-4 text-sm text-slate-600 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Views</p>
          <p className="text-2xl font-semibold text-slate-900">{views}</p>
        </div>
        <div className="rounded-2xl bg-white/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Try-ons</p>
          <p className="text-2xl font-semibold text-slate-900">{tryons}</p>
        </div>
      </div>
      <div className="mt-4 rounded-3xl border border-white/60 bg-white/60 p-4">
        <DualLineChart
          points={series.map((point) => ({ label: point.label, primary: point.primary, secondary: point.secondary }))}
          primaryLabel="Views"
          secondaryLabel="Try-ons"
          primaryColor="#4f46e5"
          secondaryColor="#ec4899"
        />
      </div>
    </div>
  )
}

type FeedbackCardProps = {
  title: string
  subtitle: string
  statuses: Array<{ label: string; value: number }>
  total: number
}

function FeedbackCard({ title, subtitle, statuses, total }: FeedbackCardProps) {
  const palette = ["#7c3aed", "#f97316", "#ef4444"]
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#fee2fe] to-[#ffd6ec] p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-600">{subtitle}</p>
        </div>
        <span className="text-xs text-slate-500">{total} items</span>
      </div>
      <div className="mt-5 flex items-center gap-6">
        <DonutChart values={statuses.map((status) => status.value)} colors={palette} />
        <div className="space-y-2 text-sm">
          {statuses.map((status, index) => {
            const share = total > 0 ? Math.round((status.value / total) * 100) : 0
            return (
              <div key={status.label} className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />
                  {status.label}
                </span>
                <span className="text-sm font-semibold text-slate-900">{share}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

type ChannelCardProps = {
  traffic: Array<{ label: string; value: string; count: number }>
  total: number
}

function ChannelCard({ traffic, total }: ChannelCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#fef6dc] to-[#fdeab1] p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Visitas por canal</p>
          <p className="text-xs text-slate-600">Desglose semanal por fuente de tráfico.</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]">Semana</span>
      </div>
      <div className="mt-5 space-y-3">
        {traffic.map((item) => {
          const share = total > 0 ? Math.round((item.count / total) * 100) : 0
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{item.label}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
              <div className="h-2 rounded-full bg-white/70">
                <div className="h-2 rounded-full bg-amber-400" style={{ width: `${Math.min(share, 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type LargeChartCardProps = {
  title: string
  description: string
  primaryLabel: string
  secondaryLabel: string
  points: DualSeriesPoint[]
}

function LargeChartCard({ title, description, primaryLabel, secondaryLabel, points }: LargeChartCardProps) {
  return (
    <div className="rounded-[32px] border border-white/60 bg-gradient-to-b from-[#f6e8ff] to-[#f2ddff] p-6 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="flex flex-col gap-1 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {secondaryLabel}
          </span>
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-white/60 bg-white/50 p-4">
        <DualLineChart
          points={points.map((point) => ({ label: point.label, primary: point.primary, secondary: point.secondary }))}
          primaryLabel={primaryLabel}
          secondaryLabel={secondaryLabel}
          primaryColor="#10b981"
          secondaryColor="#f43f5e"
        />
      </div>
    </div>
  )
}

type TryOnCardProps = {
  conversionLabel: string
  series: SeriesPoint[]
  quickStats: Array<{ id: string; label: string; value: string }>
}

function TryOnCard({ conversionLabel, series, quickStats }: TryOnCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#dceafe] to-[#c7daf9] p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Probador virtual</p>
          <p className="text-sm text-slate-600">Conversión acumulada del periodo.</p>
        </div>
        <span className="text-sm font-semibold text-slate-900">{conversionLabel} conversión</span>
      </div>
      <div className="mt-4 rounded-3xl border border-white/60 bg-white/50 p-4">
        <SingleLineChart series={series} accent="#2563eb" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {quickStats.map((stat) => (
          <div key={stat.id} className="rounded-2xl border border-white/60 bg-white/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

type TopProductsCardProps = {
  products: Array<{ label: string; tryons: string; favorites: string; shares: string; totalInteractions: number }>
  peak: number
}

function TopProductsCard({ products, peak }: TopProductsCardProps) {
  const formatter = new Intl.NumberFormat("es-CO")
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#fff3d7] to-[#ffe4ad] p-6 shadow-xl">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-900">Top productos destacados</p>
        <p className="text-sm text-slate-600">Ranking por interacción total en el probador virtual.</p>
      </div>
      {products.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-sm text-slate-500">
          No hay productos con interacción en este periodo.
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product, index) => {
            const progress = peak > 0 ? Math.round((product.totalInteractions / peak) * 100) : 0
            return (
              <div key={product.label} className="rounded-2xl border border-white/60 bg-white/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">#{index + 1}</span>
                  <span className="text-xs text-slate-500">{formatter.format(product.totalInteractions)} interacciones</span>
                </div>
                <p className="mt-2 font-semibold text-slate-900">{product.label}</p>
                <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
                  <span>Try-on {product.tryons}</span>
                  <span>Favoritos {product.favorites}</span>
                  <span>Compartidos {product.shares}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type InventoryInsightsCardProps = {
  healthPercent: number
  categoryBreakdown: Array<{ label: string; value: number }>
  categoryTotal: number
  traffic: Array<{ label: string; value: string; count: number }>
  trafficTotal: number
}

function InventoryInsightsCard({ healthPercent, categoryBreakdown, categoryTotal, traffic, trafficTotal }: InventoryInsightsCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#dcfce7] to-[#bbf7d0] p-6 shadow-xl">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-900">Insights de inventario</p>
        <p className="text-sm text-slate-600">Salud del stock, categorías activas y tráfico del catálogo.</p>
      </div>
      <div className="rounded-2xl bg-white/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Salud del inventario</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-slate-900">{healthPercent.toFixed(0)}%</span>
          <span className="text-xs text-slate-500">Cumplimiento objetivo</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-100">
          <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(healthPercent, 100))}%` }} />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Categorías destacadas</p>
        {categoryBreakdown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-6 text-sm text-slate-500">
            No hay categorías con stock disponible en este filtro.
          </div>
        ) : (
          categoryBreakdown.map((category) => {
            const share = categoryTotal > 0 ? Math.round((category.value / categoryTotal) * 100) : 0
            return (
              <div key={category.label} className="flex items-center justify-between text-sm text-slate-600">
                <span>{category.label}</span>
                <span className="font-semibold text-slate-900">{share}%</span>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Tráfico del catálogo</p>
        {traffic.map((item) => {
          const share = trafficTotal > 0 ? Math.round((item.count / trafficTotal) * 100) : 0
          return (
            <div key={item.label} className="flex items-center justify-between text-sm text-slate-600">
              <span>{item.label}</span>
              <span className="font-semibold text-slate-900">{item.value} · {share}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type StockAlertsCardProps = {
  highlight?: StockHighlight
  lowStock: Array<{ label: string; stock: string; minimum: string; status: string }>
}

function StockAlertsCard({ highlight, lowStock }: StockAlertsCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#fce7f3] to-[#fbcfe8] p-6 shadow-xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Alertas de stock</p>
          <p className="text-sm text-slate-600">Productos con criticidad alta detectados.</p>
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-rose-500">Crítico</span>
      </div>
      {highlight ? (
        <div className="mt-4 rounded-3xl border border-rose-100 bg-white/80 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">{highlight.product}</p>
              <p className="text-xs text-slate-500">SKU: {highlight.sku ?? "Sin SKU"}</p>
            </div>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">{highlight.status}</span>
          </div>
          <div className="mt-3 grid gap-3 text-xs text-slate-500 sm:grid-cols-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{highlight.stock}</p>
              <p>Stock actual</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{highlight.minimum}</p>
              <p>Mínimo requerido</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{highlight.location ?? "Sin ubicación"}</p>
              <p>Ubicación</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-dashed border-rose-200 bg-white/60 p-6 text-sm text-slate-500">
          No hay alertas activas para los filtros actuales.
        </div>
      )}
      <div className="mt-5 space-y-2 text-sm">
        {lowStock.slice(0, 3).map((item) => (
          <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/50 px-4 py-2">
            <span className="text-slate-600">{item.label}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-500">{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

type MovementsCardProps = {
  movements: MovementExport[]
}

function MovementsCard({ movements }: MovementsCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#e0f2fe] to-[#c7e0fb] p-6 shadow-xl">
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-900">Movimientos recientes</p>
        <p className="text-sm text-slate-600">Últimas operaciones confirmadas en inventario.</p>
      </div>
      {movements.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 text-sm text-slate-500">
          No registramos movimientos en el periodo filtrado.
        </div>
      ) : (
        <div className="space-y-3">
          {movements.map((movement) => (
            <div key={movement.id} className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm">
              <div>
                <p className="font-semibold text-slate-900">{movement.description}</p>
                <p className="text-xs text-slate-500">{movement.date}</p>
              </div>
              <span className={`text-sm font-semibold ${movement.direction === "in" ? "text-emerald-600" : "text-rose-600"}`}>
                {movement.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type LocationPanoramaCardProps = {
  overview: LocationOverview
}

function LocationPanoramaCard({ overview }: LocationPanoramaCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#ecfeff] to-[#cffafe] p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Panorama por bodega</p>
          <p className="text-sm text-slate-600">Distribución de inventario y alertas por ubicación.</p>
        </div>
        <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">Logística</span>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Valor inventario</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{overview.inventoryValue}</p>
          <p className="text-xs text-slate-500">{overview.activeLocations} bodegas activas</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{overview.totalUnits} uds</p>
          <p className="text-xs text-slate-500">Inventario consolidado</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Stock por bodega</p>
        {overview.distribution.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
            No hay ubicaciones con inventario disponible.
          </div>
        ) : (
          overview.distribution.map((location) => (
            <div key={location.label} className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-medium text-slate-900">{location.label}</span>
                <span>{location.units} · {Math.min(location.percent, 100)}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-white/70 px-2 py-0.5">{location.products} productos</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-sky-500" style={{ width: `${Math.min(location.percent, 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Alertas activas</p>
        {overview.alerts.length === 0 ? (
          <p className="text-sm text-slate-500">Sin alertas activas por bodega.</p>
        ) : (
          overview.alerts.map((alert) => (
            <div key={alert.label} className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/70 p-3 text-sm text-slate-600">
              <span className="font-medium text-slate-900">{alert.label}</span>
              <span className="text-xs text-amber-600">{alert.low} en seguimiento</span>
              <span className="text-xs font-semibold text-rose-600">{alert.critical} críticas</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

type ReportsCardProps = {
  reports: ReportExport[]
}

function ReportsCard({ reports }: ReportsCardProps) {
  return (
    <div className="rounded-[32px] border border-white/70 bg-gradient-to-b from-[#fef3c7] to-[#fde68a] p-6 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">Reportes recientes</p>
          <p className="text-sm text-slate-600">Historial generado desde Supabase Reports.</p>
        </div>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">Últimos {reports.length}</span>
      </div>
      {reports.length === 0 ? (
        <div className="mt-5 flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
          No se han generado reportes todavía.
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {reports.map((report) => (
            <div key={report.id} className="rounded-2xl border border-white/60 bg-white/70 p-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-semibold capitalize text-slate-900">{report.title}</span>
                <span className="text-xs text-slate-500">{report.date}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{report.summary ?? "Sin descripción."}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

type SparklineChartProps = {
  values: number[]
  trend?: "up" | "down"
}

type SingleLineChartProps = {
  series: SeriesPoint[]
  accent: string
}

function SingleLineChart({ series, accent }: SingleLineChartProps) {
  if (series.length < 2) {
    return <div className="h-24" />
  }
  const minValue = Math.min(...series.map((point) => point.value))
  const maxValue = Math.max(...series.map((point) => point.value))
  const range = maxValue - minValue || 1
  const normalized = series.map((point, index) => {
    const x = (index / (series.length - 1)) * 100
    const y = 100 - ((point.value - minValue) / range) * 100
    return `${x},${y}`
  })
  const gradientId = `single-line-gradient-${series.length}-${Math.round(series[0].value)}-${Math.round(series[series.length - 1].value)}`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-32 w-full">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={normalized.join(" ")}
      />
      <polygon
        fill={`url(#${gradientId})`}
        points={`0,100 ${normalized.join(" ")} 100,100`}
        opacity="0.4"
      />
    </svg>
  )
}

type DonutChartProps = {
  values: number[]
  colors: string[]
}

function DonutChart({ values, colors }: DonutChartProps) {
  const total = values.reduce((acc, value) => acc + value, 0)
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const segments = values.reduce<Array<{ dash: number; offset: number; color: string }>>((acc, value, index) => {
    const share = total > 0 ? value / total : 0
    const dash = share * circumference
    const previous = acc[index - 1]
    const offset = previous ? previous.offset + previous.dash : 0
    acc.push({ dash, offset, color: colors[index % colors.length] })
    return acc
  }, [])

  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32">
      <g transform="translate(60,60)">
        {segments.map((segment, index) => (
          <circle
            key={index}
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth={14}
            strokeDasharray={`${segment.dash} ${circumference - segment.dash}`}
            strokeDashoffset={-segment.offset}
          />
        ))}
        <circle r={radius - 16} fill="#fff" />
      </g>
    </svg>
  )
}

function SparklineChart({ values, trend }: SparklineChartProps) {
  if (values.length < 2) return null
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const normalized = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100
    const y = maxValue === minValue ? 50 : 100 - ((value - minValue) / (maxValue - minValue)) * 100
    return `${x},${y}`
  })
  const lastPoint = normalized[normalized.length - 1]?.split(",") ?? ["0", "0"]
  const accent = trend === "down" ? "#f43f5e" : "#6366f1"
  const gradientId = `sparkline-gradient-${values.length}-${values[0]}-${values[values.length - 1]}`

  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-12 w-full">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={normalized.join(" ")}
      />
      <polygon
        fill={`url(#${gradientId})`}
        points={`0,100 ${normalized.join(" ")} 100,100`}
        opacity="0.45"
      />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill="white" stroke={accent} strokeWidth="1.5" />
    </svg>
  )
}

type DualLineChartProps = {
  points: Array<{ label: string; primary: number; secondary?: number }>
  primaryLabel: string
  secondaryLabel?: string
  primaryColor?: string
  secondaryColor?: string
}

function DualLineChart({ points, primaryLabel, secondaryLabel, primaryColor = "#6366f1", secondaryColor = "#f97316" }: DualLineChartProps) {
  if (points.length < 2) return null
  const valuePool = points.flatMap((point) => [point.primary, point.secondary].filter((value): value is number => typeof value === "number"))
  const minValue = Math.min(...valuePool)
  const maxValue = Math.max(...valuePool)
  const range = maxValue - minValue || 1
  const topPadding = 8
  const bottomPadding = 18
  const chartHeight = 100 - topPadding - bottomPadding

  const toCoordinate = (value: number | undefined, index: number) => {
    if (value === undefined) return null
    const x = (index / (points.length - 1)) * 100
    const y = topPadding + ((maxValue - value) / range) * chartHeight
    return `${x},${y}`
  }

  const primaryPoints = points.map((point, index) => toCoordinate(point.primary, index)).filter((value): value is string => Boolean(value))
  const secondaryPoints = points.map((point, index) => toCoordinate(point.secondary, index)).filter((value): value is string => Boolean(value))

  const buildArea = (pointList: string[]) => (pointList.length > 1 ? `0,${100 - bottomPadding} ${pointList.join(" ")} 100,${100 - bottomPadding}` : "")

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full" aria-hidden>
          {primaryPoints.length > 1 ? (
            <>
              <polygon points={buildArea(primaryPoints)} fill={primaryColor} opacity="0.08" />
              <polyline points={primaryPoints.join(" ")} fill="none" stroke={primaryColor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : null}
          {secondaryLabel && secondaryPoints.length > 1 ? (
            <>
              <polygon points={buildArea(secondaryPoints)} fill={secondaryColor} opacity="0.06" />
              <polyline points={secondaryPoints.join(" ")} fill="none" stroke={secondaryColor} strokeWidth="2" strokeDasharray="6 4" strokeLinejoin="round" strokeLinecap="round" />
            </>
          ) : null}
        </svg>
        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-2 font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
            {primaryLabel}
          </span>
          {secondaryLabel ? (
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: secondaryColor }} />
              {secondaryLabel}
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-slate-400">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  )
}
