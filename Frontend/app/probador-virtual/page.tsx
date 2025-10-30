import { Camera, Sparkles, Eye, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

export default function ProbadorVirtualPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Probador Virtual</h1>
          <p className="text-muted-foreground">Experiencia de realidad aumentada con Lens Studio</p>
        </div>

        {/* Main AR Experience Card */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-br from-primary to-secondary p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="h-20 w-20 rounded-full bg-primary-foreground/20 backdrop-blur-sm mx-auto mb-6 flex items-center justify-center">
                <Camera className="h-10 w-10 text-primary-foreground" />
              </div>
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Prueba productos en tiempo real
              </h2>
              <p className="text-primary-foreground/80 mb-8 text-pretty">
                Utiliza tu cámara para visualizar cómo se ven los productos antes de comprar. Tecnología AR impulsada
                por Lens Studio.
              </p>
              <Button size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                <Play className="mr-2 h-5 w-5" />
                Iniciar Experiencia AR
              </Button>
            </div>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Visualización 3D</CardTitle>
              <CardDescription>Modelos 3D de alta calidad que se adaptan a tu entorno en tiempo real</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Efectos Realistas</CardTitle>
              <CardDescription>Iluminación y sombras dinámicas para una experiencia inmersiva</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Captura y Comparte</CardTitle>
              <CardDescription>Toma fotos y videos de tus pruebas virtuales para compartir</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Available Products for AR */}
        <Card>
          <CardHeader>
            <CardTitle>Productos Disponibles para Prueba Virtual</CardTitle>
            <CardDescription>Selecciona un producto para probarlo con AR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { nombre: "Gafas de Sol", categoria: "Accesorios" },
                { nombre: "Reloj Inteligente", categoria: "Tecnología" },
                { nombre: "Gorra Deportiva", categoria: "Accesorios" },
                { nombre: "Auriculares", categoria: "Tecnología" },
              ].map((producto, index) => (
                <div
                  key={index}
                  className="border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="aspect-square bg-accent rounded-lg mb-3 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{producto.nombre}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{producto.categoria}</p>
                  <Button size="sm" variant="outline" className="w-full bg-transparent">
                    Probar AR
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lens Studio Integration Info */}
        <Card className="mt-8 bg-accent border-accent">
          <CardHeader>
            <CardTitle>Integración con Lens Studio</CardTitle>
            <CardDescription>
              Esta plataforma utiliza Snap Lens Studio para crear experiencias de realidad aumentada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Modelos 3D Optimizados</h4>
                  <p className="text-sm text-muted-foreground">
                    Todos los productos cuentan con modelos 3D optimizados para AR
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Tracking Facial y de Manos</h4>
                  <p className="text-sm text-muted-foreground">
                    Tecnología avanzada de seguimiento para posicionamiento preciso
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-primary-foreground font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Experiencia Cross-Platform</h4>
                  <p className="text-sm text-muted-foreground">Compatible con dispositivos móviles y web</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
