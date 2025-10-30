import Link from "next/link"
import { ArrowRight, Package, Eye, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      <section className="relative">
        {/* Hero Video */}
        <div className="w-full h-[35vh] md:h-[40vh] bg-[#11120D] overflow-hidden">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover">
            <source src="/video pp.mp4" type="video/mp4" />
            Tu navegador no soporta el elemento de video.
          </video>
        </div>

        {/* Hero Content */}
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs md:text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Tecnología de Realidad Aumentada
            </p>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black text-foreground mb-4 text-balance uppercase">
              Prueba antes de comprar
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-2xl mx-auto text-pretty">
              Experimenta productos en tiempo real con nuestro probador virtual
            </p>
            <Button size="lg" className="bg-[#11120D] text-[#FFFBF4] hover:bg-[#11120D]/90 rounded-full px-8">
              Explorar
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Link href="/productos" className="group">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3 text-foreground">Catálogo de Productos</h3>
              <p className="text-muted-foreground mb-4 text-pretty">
                Explora nuestra amplia selección de productos con información detallada y visualización inmersiva.
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Ver catálogo
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link href="/probador-virtual" className="group">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3 text-foreground">Probador Virtual AR</h3>
              <p className="text-muted-foreground mb-4 text-pretty">
                Experiencia inmersiva de prueba virtual con tecnología Lens Studio para visualizar productos en tiempo
                real.
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Probar ahora
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          <Link href="/login" className="group">
            <div className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3 text-foreground">Panel de Gestión</h3>
              <p className="text-muted-foreground mb-4 text-pretty">
                Acceso administrativo para gestionar inventario, visualizar reportes y configurar el sistema.
              </p>
              <span className="text-primary font-medium inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Acceder
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-3xl p-12 md:p-16 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-6 text-balance">
            Revoluciona tu experiencia de compra
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto text-pretty">
            Descubre productos con tecnología de realidad aumentada y vive una experiencia de compra única.
          </p>
          <Link href="/probador-virtual">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-full px-8">
              Probar ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="inline-block">
                <img src="/logo.png" alt="TryOnWeb" className="h-8 object-contain" />
              </Link>
              <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
                <Link href="/productos" className="hover:text-foreground transition-colors">
                  Catálogo
                </Link>
                <Link href="/probador-virtual" className="hover:text-foreground transition-colors">
                  Probador Virtual
                </Link>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Acceder
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
