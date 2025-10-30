import { TrendingUp, TrendingDown, Package, Eye, DollarSign, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

export default function ReportesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Reportes y Analytics</h1>
          <p className="text-muted-foreground">Visualiza el rendimiento de tu inventario</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">$284,592</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+18.2%</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Productos Activos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">1,284</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+12.5%</span> este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas AR Totales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">15,847</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <span className="text-green-600">+34.8%</span> esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de Conversión</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">24.8%</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <TrendingDown className="h-3 w-3 text-red-600" />
                <span className="text-red-600">-2.1%</span> vs semana anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Productos Más Vistos</CardTitle>
              <CardDescription>Top 5 productos con más pruebas virtuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nombre: "Gafas de Sol Aviador", vistas: 2847, cambio: "+12%" },
                  { nombre: "Reloj Deportivo", vistas: 2134, cambio: "+8%" },
                  { nombre: "Gorra Snapback", vistas: 1923, cambio: "+15%" },
                  { nombre: "Auriculares Bluetooth", vistas: 1756, cambio: "+5%" },
                  { nombre: "Mochila Urbana", vistas: 1542, cambio: "+3%" },
                ].map((producto, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                        <span className="font-bold text-foreground">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{producto.nombre}</p>
                        <p className="text-sm text-muted-foreground">{producto.vistas} vistas</p>
                      </div>
                    </div>
                    <span className="text-sm text-green-600 font-medium">{producto.cambio}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Categorías Populares</CardTitle>
              <CardDescription>Distribución de productos por categoría</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nombre: "Ropa", porcentaje: 35, productos: 445 },
                  { nombre: "Calzado", porcentaje: 28, productos: 234 },
                  { nombre: "Deportes", porcentaje: 18, productos: 178 },
                  { nombre: "Accesorios", porcentaje: 12, productos: 156 },
                  { nombre: "Tecnología", porcentaje: 7, productos: 89 },
                ].map((categoria, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{categoria.nombre}</span>
                      <span className="text-sm text-muted-foreground">
                        {categoria.porcentaje}% ({categoria.productos})
                      </span>
                    </div>
                    <div className="h-2 bg-accent rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${categoria.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Stock Crítico</CardTitle>
              <CardDescription>Productos con bajo inventario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-destructive mb-2">23</div>
              <p className="text-sm text-muted-foreground">Requieren reabastecimiento urgente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiempo Promedio AR</CardTitle>
              <CardDescription>Duración de pruebas virtuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">2:34</div>
              <p className="text-sm text-muted-foreground">Minutos por sesión</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Satisfacción</CardTitle>
              <CardDescription>Rating promedio de usuarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground mb-2">4.8/5</div>
              <p className="text-sm text-muted-foreground">Basado en 1,247 reseñas</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
