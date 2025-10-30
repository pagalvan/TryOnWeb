import Link from "next/link"
import { Plus, Search, Filter, MoreVertical, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Image from "next/image"

const productos = [
  {
    id: 1,
    nombre: "Gafas de Sol Aviador",
    categoria: "Accesorios",
    stock: 45,
    precio: "$89.99",
    imagen: "/aviator-sunglasses.png",
  },
  {
    id: 2,
    nombre: "Reloj Deportivo",
    categoria: "Tecnología",
    stock: 23,
    precio: "$199.99",
    imagen: "/sports-watch.jpg",
  },
  {
    id: 3,
    nombre: "Zapatillas Running",
    categoria: "Calzado",
    stock: 67,
    precio: "$129.99",
    imagen: "/running-shoes.jpg",
  },
  {
    id: 4,
    nombre: "Mochila Urbana",
    categoria: "Accesorios",
    stock: 34,
    precio: "$79.99",
    imagen: "/urban-backpack.png",
  },
  {
    id: 5,
    nombre: "Gorra Snapback",
    categoria: "Accesorios",
    stock: 89,
    precio: "$34.99",
    imagen: "/snapback-cap.jpg",
  },
  {
    id: 6,
    nombre: "Chaqueta Denim",
    categoria: "Ropa",
    stock: 12,
    precio: "$149.99",
    imagen: "/classic-denim-jacket.png",
  },
]

export default function InventarioPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Inventario</h1>
            <p className="text-muted-foreground">Gestiona todos tus productos</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="mr-2 h-5 w-5" />
            Agregar Producto
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar productos..." className="pl-10 bg-card" />
          </div>
          <Button variant="outline" className="md:w-auto bg-transparent">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <Link key={producto.id} href={`/productos/${producto.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer overflow-hidden group">
                <div className="aspect-square bg-accent relative overflow-hidden">
                  <Image
                    src={producto.imagen || "/placeholder.svg"}
                    alt={producto.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                        {producto.nombre}
                      </h3>
                      <p className="text-sm text-muted-foreground">{producto.categoria}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className={`font-semibold ${producto.stock < 20 ? "text-destructive" : "text-foreground"}`}>
                        {producto.stock} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="font-semibold text-foreground">{producto.precio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State (hidden when there are products) */}
        {productos.length === 0 && (
          <div className="text-center py-20">
            <div className="h-20 w-20 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-display text-2xl font-semibold mb-2">No hay productos</h3>
            <p className="text-muted-foreground mb-6">Comienza agregando tu primer producto al inventario</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-5 w-5" />
              Agregar Producto
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
