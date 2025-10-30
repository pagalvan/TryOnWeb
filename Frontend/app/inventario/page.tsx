"use client"

import Link from "next/link"
import { Plus, Search, Eye, ShoppingBag, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import Image from "next/image"
import { useState } from "react"

const productos = [
  {
    id: 1,
    nombre: "Gafas de Sol Aviador",
    categoria: "Accesorios",
    stock: 45,
    precio: "$89.99",
    imagen: "/aviator-sunglasses.png",
    destacado: true,
    nuevo: false,
  },
  {
    id: 2,
    nombre: "Reloj Deportivo",
    categoria: "Tecnología",
    stock: 23,
    precio: "$199.99",
    imagen: "/sports-watch.jpg",
    destacado: false,
    nuevo: true,
  },
  {
    id: 3,
    nombre: "Zapatillas Running",
    categoria: "Calzado",
    stock: 67,
    precio: "$129.99",
    imagen: "/running-shoes.jpg",
    destacado: false,
    nuevo: false,
  },
  {
    id: 4,
    nombre: "Mochila Urbana",
    categoria: "Accesorios",
    stock: 34,
    precio: "$79.99",
    imagen: "/urban-backpack.png",
    destacado: false,
    nuevo: false,
  },
  {
    id: 5,
    nombre: "Gorra Snapback",
    categoria: "Accesorios",
    stock: 89,
    precio: "$34.99",
    imagen: "/snapback-cap.jpg",
    destacado: false,
    nuevo: true,
  },
  {
    id: 6,
    nombre: "Chaqueta Denim",
    categoria: "Ropa",
    stock: 12,
    precio: "$149.99",
    imagen: "/classic-denim-jacket.png",
    destacado: false,
    nuevo: false,
  },
]

const categorias = ["Todos", "Accesorios", "Tecnología", "Calzado", "Ropa"]

export default function InventarioPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos")
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const productosFiltrados =
    categoriaActiva === "Todos" ? productos : productos.filter((p) => p.categoria === categoriaActiva)

  const productoDestacado = productos.find((p) => p.destacado)
  const productosRegulares = productosFiltrados.filter((p) => !p.destacado)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-1 w-12 bg-primary rounded-full" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Catálogo</p>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-3">Inventario</h1>
            <p className="text-lg text-muted-foreground max-w-xl">Explora y gestiona tu colección de productos</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-card border border-border rounded-xl px-6 py-3">
              <p className="text-xs text-muted-foreground mb-1">Total Productos</p>
              <p className="font-display text-2xl font-bold text-foreground">{productos.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-6 py-3">
              <p className="text-xs text-muted-foreground mb-1">En Stock</p>
              <p className="font-display text-2xl font-bold text-foreground">
                {productos.reduce((acc, p) => acc + p.stock, 0)}
              </p>
            </div>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        <div className="mb-10">
          <div className="relative max-w-xl mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, categoría o SKU..."
              className="pl-12 h-12 bg-card border-border rounded-full"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  categoriaActiva === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground border border-border hover:border-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {productoDestacado && categoriaActiva === "Todos" && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold text-foreground">Producto Destacado</h2>
            </div>
            <Link href={`/productos/${productoDestacado.id}`}>
              <div className="relative bg-card border border-border rounded-3xl overflow-hidden group cursor-pointer">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="aspect-square md:aspect-auto relative bg-accent overflow-hidden">
                    <Image
                      src={productoDestacado.imagen || "/placeholder.svg"}
                      alt={productoDestacado.nombre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-6 left-6">
                      <Badge className="bg-primary text-primary-foreground border-0">Destacado</Badge>
                    </div>
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
                      {productoDestacado.categoria}
                    </p>
                    <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                      {productoDestacado.nombre}
                    </h3>
                    <p className="text-muted-foreground mb-6 text-lg">
                      Producto premium de nuestra colección con características excepcionales
                    </p>
                    <div className="flex items-center gap-6 mb-8">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Precio</p>
                        <p className="font-display text-3xl font-bold text-foreground">{productoDestacado.precio}</p>
                      </div>
                      <div className="h-12 w-px bg-border" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Stock Disponible</p>
                        <p className="font-display text-3xl font-bold text-foreground">{productoDestacado.stock}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
                        <Eye className="mr-2 h-5 w-5" />
                        Ver Detalles
                      </Button>
                      <Button variant="outline" className="rounded-full border-border bg-transparent">
                        <ShoppingBag className="mr-2 h-5 w-5" />
                        Gestionar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-6">
            {categoriaActiva === "Todos" ? "Todos los Productos" : categoriaActiva}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosRegulares.map((producto, index) => (
              <Link
                key={producto.id}
                href={`/productos/${producto.id}`}
                onMouseEnter={() => setHoveredId(producto.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group ${index % 5 === 0 ? "md:col-span-2 md:row-span-1" : ""}`}
              >
                <div className="relative bg-card border border-border rounded-2xl overflow-hidden h-full transition-all hover:shadow-xl hover:border-primary/50">
                  <div
                    className={`relative bg-accent overflow-hidden ${
                      index % 5 === 0 ? "aspect-[2/1]" : "aspect-square"
                    }`}
                  >
                    <Image
                      src={producto.imagen || "/placeholder.svg"}
                      alt={producto.nombre}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {producto.nuevo && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-primary text-primary-foreground border-0">Nuevo</Badge>
                      </div>
                    )}
                    {producto.stock < 20 && (
                      <div className="absolute top-4 left-4">
                        <Badge variant="destructive" className="border-0">
                          Stock Bajo
                        </Badge>
                      </div>
                    )}

                    <div
                      className={`absolute inset-0 bg-primary/95 flex items-center justify-center gap-3 transition-opacity duration-300 ${
                        hoveredId === producto.id ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Button
                        size="lg"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-full"
                      >
                        <Eye className="mr-2 h-5 w-5" />
                        Vista Rápida
                      </Button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
                          {producto.categoria}
                        </p>
                        <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {producto.nombre}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Precio</p>
                        <p className="font-display text-xl font-bold text-foreground">{producto.precio}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Stock</p>
                        <p
                          className={`font-display text-xl font-bold ${
                            producto.stock < 20 ? "text-destructive" : "text-foreground"
                          }`}
                        >
                          {producto.stock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-20">
            <div className="h-24 w-24 rounded-full bg-accent mx-auto mb-6 flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="font-display text-3xl font-bold mb-3 text-foreground">No hay productos</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              No se encontraron productos en esta categoría. Intenta con otra categoría o agrega nuevos productos.
            </p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full">
              <Plus className="mr-2 h-5 w-5" />
              Agregar Producto
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
