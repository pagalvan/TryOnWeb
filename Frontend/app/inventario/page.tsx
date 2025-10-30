"use client"
import { Plus, Search, Eye, ShoppingBag, Filter, Download, MoreVertical, TrendingUp, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import Image from "next/image"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const productos = [
  {
    id: 1,
    nombre: "Gafas de Sol Aviador",
    categoria: "Accesorios",
    sku: "ACC-001",
    stock: 45,
    precio: 89.99,
    imagen: "/aviator-sunglasses.png",
    destacado: true,
    nuevo: false,
  },
  {
    id: 2,
    nombre: "Reloj Deportivo",
    categoria: "Tecnología",
    sku: "TEC-002",
    stock: 23,
    precio: 199.99,
    imagen: "/sports-watch.jpg",
    destacado: false,
    nuevo: true,
  },
  {
    id: 3,
    nombre: "Zapatillas Running",
    categoria: "Calzado",
    sku: "CAL-003",
    stock: 67,
    precio: 129.99,
    imagen: "/running-shoes.jpg",
    destacado: false,
    nuevo: false,
  },
  {
    id: 4,
    nombre: "Mochila Urbana",
    categoria: "Accesorios",
    sku: "ACC-004",
    stock: 34,
    precio: 79.99,
    imagen: "/urban-backpack.png",
    destacado: false,
    nuevo: false,
  },
  {
    id: 5,
    nombre: "Gorra Snapback",
    categoria: "Accesorios",
    sku: "ACC-005",
    stock: 89,
    precio: 34.99,
    imagen: "/snapback-cap.jpg",
    destacado: false,
    nuevo: true,
  },
  {
    id: 6,
    nombre: "Chaqueta Denim",
    categoria: "Ropa",
    sku: "ROP-006",
    stock: 12,
    precio: 149.99,
    imagen: "/classic-denim-jacket.png",
    destacado: false,
    nuevo: false,
  },
]

const categorias = ["Todos", "Accesorios", "Tecnología", "Calzado", "Ropa"]

export default function InventarioPage() {
  const [categoriaActiva, setCategoriaActiva] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")

  const productosFiltrados = productos.filter((p) => {
    const matchCategoria = categoriaActiva === "Todos" || p.categoria === categoriaActiva
    const matchSearch =
      p.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategoria && matchSearch
  })

  const totalStock = productos.reduce((acc, p) => acc + p.stock, 0)
  const totalValor = productos.reduce((acc, p) => acc + p.stock * p.precio, 0)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gestión de Productos</p>
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-2 tracking-tight">Inventario</h1>
            <p className="text-lg text-muted-foreground">Administra tu catálogo de productos de forma eficiente</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-card border border-border rounded-xl px-5 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Total Productos</p>
              <p className="text-2xl font-bold text-foreground">{productos.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-5 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Unidades en Stock</p>
              <p className="text-2xl font-bold text-foreground">{totalStock}</p>
            </div>
            <div className="bg-card border border-border rounded-xl px-5 py-3">
              <p className="text-xs text-muted-foreground mb-1 font-medium">Valor Total</p>
              <p className="text-2xl font-bold text-foreground">${totalValor.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, categoría o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-background"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoriaActiva === cat
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="font-semibold">SKU</TableHead>
                <TableHead className="font-semibold">Categoría</TableHead>
                <TableHead className="font-semibold">Stock</TableHead>
                <TableHead className="font-semibold">Precio</TableHead>
                <TableHead className="font-semibold">Estado</TableHead>
                <TableHead className="text-right font-semibold">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosFiltrados.map((producto) => (
                <TableRow key={producto.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        <Image
                          src={producto.imagen || "/placeholder.svg"}
                          alt={producto.nombre}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{producto.nombre}</p>
                        {producto.destacado && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Destacado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm text-muted-foreground font-mono">{producto.sku}</code>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {producto.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 max-w-[100px]">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              producto.stock < 20 ? "bg-warning" : producto.stock < 50 ? "bg-chart-3" : "bg-success"
                            }`}
                            style={{ width: `${Math.min((producto.stock / 100) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-sm font-medium ${producto.stock < 20 ? "text-warning" : "text-foreground"}`}
                      >
                        {producto.stock}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">${producto.precio.toFixed(2)}</span>
                  </TableCell>
                  <TableCell>
                    {producto.nuevo ? (
                      <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Nuevo</Badge>
                    ) : producto.stock < 20 ? (
                      <Badge className="bg-warning/10 text-warning border-warning/20">Stock Bajo</Badge>
                    ) : (
                      <Badge className="bg-success/10 text-success border-success/20">Disponible</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Package className="h-4 w-4 mr-2" />
                          Editar producto
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Gestionar stock
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {productosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No se encontraron productos</h3>
              <p className="text-muted-foreground mb-6">
                Intenta ajustar los filtros o agrega nuevos productos al inventario
              </p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Agregar Producto
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
