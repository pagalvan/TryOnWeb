import Link from "next/link"
import { Package, Eye, BarChart3, Settings, TrendingUp, AlertCircle, Box } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido a tu panel de control de TryOnWeb</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">1,284</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+12%</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas Virtuales</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">3,847</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">+28%</span> esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stock Bajo</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">23</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Categorías</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">18</div>
              <p className="text-xs text-muted-foreground mt-1">Activas en sistema</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/inventario" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Gestionar Inventario</CardTitle>
                <CardDescription>Ver, agregar y editar productos en tu inventario</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/probador-virtual" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Probador Virtual</CardTitle>
                <CardDescription>Accede al módulo de realidad aumentada</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/reportes" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Ver Reportes</CardTitle>
                <CardDescription>Analiza métricas y tendencias de tu negocio</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/categorias" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Box className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Categorías</CardTitle>
                <CardDescription>Organiza tus productos por categorías</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/productos" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Productos Destacados</CardTitle>
                <CardDescription>Gestiona tu catálogo de productos</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/configuracion" className="group">
            <Card className="hover:shadow-lg transition-all cursor-pointer">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">Configuración</CardTitle>
                <CardDescription>Ajusta las preferencias del sistema</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimas acciones en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Producto agregado", item: "Gafas de Sol Aviador", time: "Hace 5 minutos" },
                { action: "Prueba virtual realizada", item: "Reloj Deportivo", time: "Hace 12 minutos" },
                { action: "Stock actualizado", item: "Zapatillas Running", time: "Hace 1 hora" },
                { action: "Categoría creada", item: "Accesorios Deportivos", time: "Hace 2 horas" },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.item}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
