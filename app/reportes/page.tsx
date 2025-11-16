import { DollarSign, Package, Eye, Users, AlertTriangle, Clock, BarChart3, PieChart } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchReportsOverview } from "@/lib/services/reports"

const formatNumber = (value: number) => new Intl.NumberFormat("es-CO").format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)

const formatPercentage = (value: number) => `${value.toFixed(1)}%`

const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—"
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds % 60)
  return `${minutes}:${remaining.toString().padStart(2, "0")}`
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export default async function ReportesPage() {
  const overview = await fetchReportsOverview()

  const lowStock = overview.lowStock.slice(0, 5)
  const trafficTotal = overview.traffic.reduce((total, item) => total + item.count, 0) || 1

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 space-y-8">
        <header>
          <h1 className="text-4xl font-bold text-foreground">Reportes y Analytics</h1>
          <p className="text-muted-foreground">Visualiza métricas reales de inventario, pruebas virtuales y actividad.</p>
        </header>

        <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Valor total inventario</CardDescription>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(overview.metrics.inventoryValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Incluye todas las unidades con precio configurado.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Productos activos</CardDescription>
              <Package className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatNumber(overview.metrics.activeProducts)}</p>
              <p className="text-xs text-muted-foreground mt-1">Productos con estado distinto de inactivo.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Pruebas virtuales</CardDescription>
              <Eye className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatNumber(overview.tryOn.sessions)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumber(overview.tryOn.items)} interacciones únicas con prendas.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>Tasa de conversión</CardDescription>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{formatPercentage(overview.metrics.conversionRate)}</p>
              <p className="text-xs text-muted-foreground mt-1">Comparación de try-on vs vistas en el catálogo.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Productos con más actividad</CardTitle>
                <CardDescription>Basado en eventos de vista, try-on y favoritos.</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay actividad registrada.</p>
              ) : (
                overview.topProducts.map((product) => (
                  <div key={product.productId} className="border border-dashed rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{product.productName}</p>
                        <p className="text-xs text-muted-foreground">SKU: {product.sku ?? "Sin SKU"}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {formatNumber(product.tryons)} try-on
                      </Badge>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Vistas</span>
                        <span className="font-medium text-foreground">{formatNumber(product.views)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Favoritos</span>
                        <span className="font-medium text-foreground">{formatNumber(product.favorites)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Compartidos</span>
                        <span className="font-medium text-foreground">{formatNumber(product.shares)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Distribución por categoría</CardTitle>
                <CardDescription>Porcentaje de productos por categoría.</CardDescription>
              </div>
              <PieChart className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.categoryDistribution.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay categorías registradas.</p>
              ) : (
                overview.categoryDistribution.slice(0, 6).map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{category.nombre}</span>
                      <span className="text-muted-foreground">
                        {formatPercentage(category.percentage)} · {formatNumber(category.productCount)} productos
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full mt-2">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.max(category.percentage, category.productCount > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alertas de stock</CardTitle>
                <CardDescription>Productos que requieren atención inmediata.</CardDescription>
              </div>
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay alertas activas.</p>
              ) : (
                lowStock.map((item) => (
                  <div key={item.productId} className="border border-dashed rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku ?? "Sin SKU"}</p>
                      </div>
                      <Badge variant={item.status === "critical" ? "destructive" : "outline"} className="capitalize">
                        {item.status === "critical" ? "Crítico" : "Atención"}
                      </Badge>
                    </div>
                    <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Stock total</p>
                        <p className="font-medium">{formatNumber(item.totalStock)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mínimo requerido</p>
                        <p className="font-medium">{formatNumber(item.minimumStock)}</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                      {item.locations.map((location) => (
                        <div key={location.id} className="flex items-center justify-between">
                          <span>{location.location}</span>
                          <span>
                            {formatNumber(location.quantity)} / {formatNumber(location.minimum)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Métricas de try-on</CardTitle>
                <CardDescription>Engagement del probador virtual.</CardDescription>
              </div>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Duración promedio</span>
                <span className="font-medium text-foreground">{formatDuration(overview.tryOn.averageDurationSeconds)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Prendas probadas</span>
                <span className="font-medium text-foreground">{formatNumber(overview.tryOn.uniqueProducts)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total de eventos</span>
                <span className="font-medium text-foreground">{formatNumber(overview.tryOn.items)}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tráfico por evento</CardTitle>
              <CardDescription>Resumen de interacciones registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.traffic.map((item) => {
                const percentage = Math.round((item.count / trafficTotal) * 100)
                return (
                  <div key={item.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-foreground">{item.label}</span>
                      <span className="text-muted-foreground">{formatNumber(item.count)} · {percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-accent">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(percentage, item.count > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reportes recientes</CardTitle>
              <CardDescription>Historial de reportes generados en Supabase.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {overview.recentReports.length === 0 ? (
                <p className="text-muted-foreground">No hay reportes generados.</p>
              ) : (
                overview.recentReports.map((report) => (
                  <div key={report.id} className="border border-dashed rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground capitalize">{report.type}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(report.createdAt)}</span>
                    </div>
                    {report.summary ? (
                      <p className="text-xs text-muted-foreground mt-2">{report.summary}</p>
                    ) : null}
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
