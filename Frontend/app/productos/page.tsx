"use client"

import Link from "next/link"
import { Plus, Search, Grid3x3, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import Image from "next/image"
import { useEffect, useState } from "react"

const productos = [
  {
    id: 1,
    nombre: "Gafas de Sol Aviador",
    categoria: "Accesorios",
    precio: "$89.99",
    imagen: "/aviator-sunglasses.png",
  },
  { id: 2, nombre: "Reloj Deportivo", categoria: "Tecnología", precio: "$199.99", imagen: "/sports-watch.jpg" },
  { id: 3, nombre: "Zapatillas Running", categoria: "Calzado", precio: "$129.99", imagen: "/running-shoes.jpg" },
  { id: 4, nombre: "Mochila Urbana", categoria: "Accesorios", precio: "$79.99", imagen: "/urban-backpack.png" },
  { id: 5, nombre: "Gorra Snapback", categoria: "Accesorios", precio: "$34.99", imagen: "/snapback-cap.jpg" },
  { id: 6, nombre: "Chaqueta Denim", categoria: "Ropa", precio: "$149.99", imagen: "/classic-denim-jacket.png" },
]

export default function ProductosPage() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Catálogo</h1>
            <p className="text-muted-foreground">Explora nuestra colección completa</p>
          </div>
          {userRole === "admin" && (
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="mr-2 h-5 w-5" />
              Nuevo Producto
            </Button>
          )}
        </div>

        {/* Search and View Options */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar productos..." className="pl-9 h-10 bg-card" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-10 w-10 bg-transparent">
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productos.map((producto) => (
            <Link key={producto.id} href={`/productos/${producto.id}`}>
              <div className="group cursor-pointer">
                <div className="aspect-square bg-accent rounded-2xl overflow-hidden mb-4 relative">
                  <Image
                    src={producto.imagen || "/placeholder.svg"}
                    alt={producto.nombre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{producto.categoria}</p>
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {producto.nombre}
                  </h3>
                  <p className="font-bold text-foreground">{producto.precio}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
