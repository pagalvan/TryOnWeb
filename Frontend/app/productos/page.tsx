"use client"

import Link from "next/link"
import { Plus, Search, Sparkles, TrendingUp, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useEffect, useState } from "react"

const productos = [
  {
    id: 1,
    nombre: "Gafas de Sol Aviador",
    categoria: "Accesorios",
    precio: "$89.99",
    imagen: "/aviator-sunglasses.png",
    destacado: true,
    nuevo: true,
  },
  {
    id: 2,
    nombre: "Reloj Deportivo",
    categoria: "Tecnología",
    precio: "$199.99",
    imagen: "/sports-watch.jpg",
    destacado: false,
    nuevo: false,
  },
  {
    id: 3,
    nombre: "Zapatillas Running",
    categoria: "Calzado",
    precio: "$129.99",
    imagen: "/running-shoes.jpg",
    destacado: true,
    nuevo: false,
  },
  {
    id: 4,
    nombre: "Mochila Urbana",
    categoria: "Accesorios",
    precio: "$79.99",
    imagen: "/urban-backpack.png",
    destacado: false,
    nuevo: true,
  },
  {
    id: 5,
    nombre: "Gorra Snapback",
    categoria: "Accesorios",
    precio: "$34.99",
    imagen: "/snapback-cap.jpg",
    destacado: false,
    nuevo: false,
  },
  {
    id: 6,
    nombre: "Chaqueta Denim",
    categoria: "Ropa",
    precio: "$149.99",
    imagen: "/classic-denim-jacket.png",
    destacado: false,
    nuevo: true,
  },
]

const categorias = ["Todos", "Accesorios", "Camisetas", "Vestidos", "Pantalones"]

export default function ProductosPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"))
    }
  }, [])

  const productoDestacado = productos.find((p) => p.destacado)
  const productosRegulares = productos.filter((p) => !p.destacado)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="relative mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 backdrop-blur-sm border border-border animate-fade-in">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Colección Exclusiva</span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground tracking-tight leading-none text-balance">
                Descubre tu
                <span className="block text-primary mt-2">estilo único</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Explora nuestra selección curada de productos diseñados para destacar tu personalidad
              </p>
            </div>

            {userRole === "admin" && (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Plus className="mr-2 h-5 w-5" />
                Agregar Producto
              </Button>
            )}
          </div>

          <div className="absolute -top-8 right-0 w-32 h-32 bg-accent/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-20 -left-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse delay-700" />
        </div>

        <div className="mb-12 space-y-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 rounded-3xl blur-xl" />
            <div className="relative bg-card/80 backdrop-blur-md rounded-3xl border border-border p-6 shadow-lg">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Busca tu próximo favorito..."
                  className="pl-14 pr-6 h-14 bg-background/50 border-border text-base rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categorias.map((categoria, index) => (
              <button
                key={categoria}
                onClick={() => setSelectedCategory(categoria)}
                className={`group relative px-6 py-3 rounded-full font-medium text-sm transition-all duration-300 hover:scale-105 ${
                  selectedCategory === categoria
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card text-foreground border border-border hover:border-primary/50 hover:shadow-md"
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {selectedCategory === categoria && (
                  <div className="absolute inset-0 bg-primary rounded-full animate-pulse opacity-50" />
                )}
                <span className="relative z-10">{categoria}</span>
              </button>
            ))}
          </div>
        </div>

        {productoDestacado && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold text-foreground">Producto Destacado</h2>
            </div>
            <Link href={`/productos/${productoDestacado.id}`}>
              <div className="group relative bg-card rounded-3xl border border-border overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                <div className="grid md:grid-cols-2 gap-0">
                  {/* Image side */}
                  <div className="relative aspect-square md:aspect-auto overflow-hidden bg-accent">
                    <Image
                      src={productoDestacado.imagen || "/placeholder.svg"}
                      alt={productoDestacado.nombre}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r" />
                    {productoDestacado.nuevo && (
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-primary text-primary-foreground border-0 px-4 py-2 text-sm font-semibold shadow-lg">
                          <Star className="h-3 w-3 mr-1 inline" />
                          Nuevo
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content side */}
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-accent text-accent-foreground border-0 px-4 py-1">
                      {productoDestacado.categoria}
                    </Badge>
                    <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                      {productoDestacado.nombre}
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                      Descubre la perfecta combinación de estilo y funcionalidad en este producto exclusivo de nuestra
                      colección.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-4xl font-bold text-foreground">
                        {productoDestacado.precio}
                      </span>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 h-12 rounded-full shadow-lg group-hover:shadow-xl transition-all">
                        Ver Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground">Toda la Colección</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosRegulares.map((producto, index) => (
              <Link
                key={producto.id}
                href={`/productos/${producto.id}`}
                className={index === 0 ? "sm:col-span-2 lg:col-span-1" : ""}
              >
                <div
                  className="group relative h-full"
                  onMouseEnter={() => setHoveredCard(producto.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div
                    className={`relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-500 h-full flex flex-col ${
                      hoveredCard === producto.id
                        ? "shadow-2xl scale-[1.03] -translate-y-2 border-primary/30"
                        : "shadow-md hover:shadow-xl"
                    }`}
                  >
                    {/* Image container with overlay effect */}
                    <div
                      className={`relative overflow-hidden bg-accent ${index === 0 ? "aspect-[4/3]" : "aspect-square"}`}
                    >
                      <Image
                        src={producto.imagen || "/placeholder.svg"}
                        alt={producto.nombre}
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                      />

                      {/* Gradient overlay on hover */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent transition-opacity duration-500 ${
                          hoveredCard === producto.id ? "opacity-100" : "opacity-0"
                        }`}
                      />

                      {/* Badges */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <Badge className="w-fit bg-background/90 text-foreground border-0 backdrop-blur-sm shadow-lg">
                          {producto.categoria}
                        </Badge>
                        {producto.nuevo && (
                          <Badge className="w-fit bg-primary text-primary-foreground border-0 shadow-lg">Nuevo</Badge>
                        )}
                      </div>

                      {/* Quick view button on hover */}
                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                          hoveredCard === producto.id ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                      >
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 shadow-xl transform transition-transform hover:scale-110">
                          Ver Producto
                        </Button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-display text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                        {producto.nombre}
                      </h3>

                      <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
                        <span className="font-display text-2xl font-bold text-foreground">{producto.precio}</span>
                        <div
                          className={`transform transition-transform duration-300 ${
                            hoveredCard === producto.id ? "translate-x-2" : ""
                          }`}
                        >
                          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {productos.length === 0 && (
          <div className="text-center py-24">
            <div className="relative inline-block mb-8">
              <div className="absolute inset-0 bg-accent/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-accent border-2 border-border">
                <Search className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-display text-3xl font-bold text-foreground mb-3">No encontramos productos</h3>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Intenta ajustar los filtros o explora otras categorías para descubrir más opciones
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
