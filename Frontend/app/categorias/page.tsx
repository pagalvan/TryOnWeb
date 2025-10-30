import Link from "next/link"
import { Plus, MoreVertical, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"

const categorias = [
  { id: 1, nombre: "Accesorios", productos: 156, color: "bg-blue-500" },
  { id: 2, nombre: "Tecnología", productos: 89, color: "bg-purple-500" },
  { id: 3, nombre: "Calzado", productos: 234, color: "bg-green-500" },
  { id: 4, nombre: "Ropa", productos: 445, color: "bg-orange-500" },
  { id: 5, nombre: "Deportes", productos: 178, color: "bg-red-500" },
  { id: 6, nombre: "Hogar", productos: 92, color: "bg-teal-500" },
]

export default function CategoriasPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Categorías</h1>
            <p className="text-muted-foreground">Organiza tus productos por categorías</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Categoría
          </Button>
        </div>

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categorias.map((categoria) => (
            <Card key={categoria.id} className="hover:shadow-lg transition-all cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl ${categoria.color} flex items-center justify-center`}>
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <h3 className="font-display text-2xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {categoria.nombre}
                </h3>
                <p className="text-muted-foreground">{categoria.productos} productos</p>

                <div className="mt-6 pt-4 border-t border-border">
                  <Link href={`/categorias/${categoria.id}`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Ver productos
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
