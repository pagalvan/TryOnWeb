import { Package, Banknote, Boxes, Eye, Activity } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchDashboardOverview } from "@/lib/services/dashboard"

const formatNumber = (value: number) => new Intl.NumberFormat("es-CO").format(value)

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))

export default async function DashboardPage() {
  const overview = await fetchDashboardOverview()

  const lowStock = overview.inventory.lowStock.slice(0, 5)
  const trafficTotal = overview.productTraffic.reduce((total, item) => total + item.count, 0) || 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/50">
      <Navbar />

      <main className="container mx-auto px-6 py-8 max-w-7xl space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de control</h1>
          <p className="text-gray-600">Resumen actualizado de inventario y actividad en TryOnWeb.</p>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardDescription>Total de productos</CardDescription>
                <CardTitle className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(overview.metrics.totalProducts)}
                </CardTitle>
              </div>
              <span className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatNumber(overview.metrics.activeProducts)} productos activos en catálogo.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardDescription>Valor del inventario</CardDescription>
                <CardTitle className="text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(overview.metrics.totalInventoryValue)}
                </CardTitle>
              </div>
              <span className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Banknote className="h-5 w-5 text-emerald-600" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Calculado con el stock actual y el valor unitario configurado.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardDescription>Unidades en stock</CardDescription>
                <CardTitle className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(overview.metrics.totalStockUnits)}
                </CardTitle>
              </div>
              <span className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Boxes className="h-5 w-5 text-violet-600" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Monitorea las unidades disponibles en todas las ubicaciones.
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardDescription>Pruebas virtuales</CardDescription>
                <CardTitle className="text-3xl font-bold text-gray-900 mt-1">
                  {formatNumber(overview.metrics.tryOnSessions)}
                </CardTitle>
              </div>
              <span className="h-10 w-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {formatNumber(overview.metrics.tryOnItems)} pruebas registradas sobre prendas.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid xl:grid-cols-3 gap-6">
          <Card className="xl:col-span-2 border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Alertas de stock</CardTitle>
                <CardDescription>Productos con existencias por debajo del mínimo o en estado crítico.</CardDescription>
              </div>
              <Badge variant={overview.metrics.lowStockProducts > 0 ? "destructive" : "secondary"}>
                {overview.metrics.lowStockProducts} alerta
                {overview.metrics.lowStockProducts === 1 ? "" : "s"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay alertas de stock registradas.</p>
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
                    <div className="mt-3 grid md:grid-cols-2 gap-3 text-sm">
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

          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Interacciones con productos</CardTitle>
              <CardDescription>Eventos registrados en el catálogo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.productTraffic.map((item) => {
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
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Categorías destacadas</CardTitle>
              <CardDescription>Total de productos por categoría.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {overview.categories.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay categorías registradas.</p>
              ) : (
                overview.categories.slice(0, 6).map((category) => (
                  <div key={category.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{category.nombre}</span>
                      <span className="text-muted-foreground">{formatNumber(category.productCount)} productos</span>
                    </div>
                    <div className="h-2 bg-accent rounded-full mt-2">
                      <div
                        className="h-full bg-muted rounded-full"
                        style={{
                          width: `${overview.metrics.totalProducts > 0 ? Math.max(
                            (category.productCount / overview.metrics.totalProducts) * 100,
                            8
                          ) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Movimientos de inventario</CardTitle>
                <CardDescription>Últimos registros documentados.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {overview.inventory.movements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay movimientos recientes.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b">
                        <th className="py-2 pr-4">Producto</th>
                        <th className="py-2 pr-4">Tipo</th>
                        <th className="py-2 pr-4">Cantidad</th>
                        <th className="py-2 pr-4">Ubicación</th>
                        <th className="py-2">Registrado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.inventory.movements.map((movement) => (
                        <tr key={movement.id} className="border-b last:border-b-0">
                          <td className="py-2 pr-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{movement.productName ?? "Producto"}</span>
                              <span className="text-xs text-muted-foreground">{movement.sku ?? "Sin SKU"}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 uppercase text-xs text-muted-foreground">{movement.type}</td>
                          <td className="py-2 pr-4 font-medium">{formatNumber(movement.quantity)}</td>
                          <td className="py-2 pr-4 text-muted-foreground">{movement.location ?? "General"}</td>
                          <td className="py-2 text-muted-foreground">{formatDateTime(movement.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="border shadow-sm bg-white">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
              <CardDescription>
                {overview.metrics.totalCategories} categorías activas · {formatNumber(overview.metrics.totalStockUnits)} unidades en
                stock · {formatNumber(overview.metrics.lowStockProducts)} alertas pendientes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
              <Activity className="h-5 w-5 text-primary" />
              <p>
                Mantén actualizado el inventario para mejorar la precisión de los reportes y prioriza las alertas de stock
                crítico.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
