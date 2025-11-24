"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useSearchParams } from "next/navigation"
import { ChevronDown, Loader2, Plus, Search, Sparkles, Star, TrendingUp, SlidersHorizontal, ArrowUpDown } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"

type Categoria = {
  id: string
  nombre: string
}

type LensAsset = {
  id: string
  tipo: string
  url: string
  provider: string | null
  version: string | null
  metadata: Record<string, unknown> | null
  activo: boolean
}

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  categoria_id: string | null
  categorias?: Categoria | null
  valor_unitario: number | null
  metadata: Record<string, any> | null
  destacado: boolean
  estado: string
  sku: string | null
  created_at?: string
  nuevo?: boolean
  hasLens?: boolean
  lens_assets?: LensAsset[] | null
  colores?: string[]
  tallas?: string[]
}

export default function ProductosPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Todos"])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [showArOnly, setShowArOnly] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(true)
  const [sortBy, setSortBy] = useState("destacados")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0])

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"))
    }
    fetchData()
  }, [])

  const { minPrice, maxPrice } = useMemo(() => {
    if (productos.length === 0) return { minPrice: 0, maxPrice: 0 }
    const prices = productos.map(p => p.valor_unitario || 0)
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    }
  }, [productos])

  useEffect(() => {
    if (maxPrice > 0 && priceRange[1] === 0) {
       setPriceRange([minPrice, maxPrice])
    }
  }, [minPrice, maxPrice])

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (category === "Todos") {
        return ["Todos"]
      }
      
      // If currently "Todos" is selected, clear it and start with the new category
      let newCategories = prev.includes("Todos") ? [] : [...prev]
      
      if (newCategories.includes(category)) {
        newCategories = newCategories.filter(c => c !== category)
      } else {
        newCategories.push(category)
      }
      
      // If nothing selected, go back to Todos
      if (newCategories.length === 0) {
        return ["Todos"]
      }
      
      return newCategories
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productosResponse, categoriasResponse] = await Promise.all([
        apiFetch<{ data: Producto[] }>("/api/products"),
        apiFetch<{ data: Categoria[] }>("/api/categories"),
      ])

      const productos = (productosResponse.data ?? []).map((producto: Producto) => {
        const lensId = getProductLensId(producto)
        return {
          ...producto,
          nuevo: esNuevo(producto.created_at),
          hasLens: lensId.length > 0,
        }
      })

      setProductos(productos)
      setCategorias(categoriasResponse.data ?? [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltro = useMemo(() => ["Todos", ...categorias.map((c) => c.nombre)], [categorias])
  const MAX_VISIBLE_CATEGORIES = 5
  const categoriasVisibles = useMemo(
    () => categoriasFiltro.slice(0, MAX_VISIBLE_CATEGORIES),
    [categoriasFiltro]
  )
  const categoriasOcultas = useMemo(
    () => categoriasFiltro.slice(MAX_VISIBLE_CATEGORIES),
    [categoriasFiltro]
  )
  const categoriaOcultaSeleccionada = useMemo(
    () => categoriasOcultas.some(c => selectedCategories.includes(c)),
    [categoriasOcultas, selectedCategories]
  )

  const availableSizes = useMemo(() => {
    const sizes = new Set<string>()
    productos.forEach(p => {
      p.tallas?.forEach(t => sizes.add(t))
    })
    return Array.from(sizes).sort()
  }, [productos])

  const availableColors = useMemo(() => {
    const colors = new Map<string, string>()
    productos.forEach(p => {
      p.colores?.forEach(c => {
        const parts = c.split(":")
        const name = parts[0]?.trim()
        const code = parts.length > 1 ? parts[1]?.trim() : name
        if (code && !colors.has(code)) {
          colors.set(code, name)
        }
      })
    })
    return Array.from(colors.entries()).map(([code, name]) => ({ code, name }))
  }, [productos])

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    )
  }

  const toggleColor = (colorCode: string) => {
    setSelectedColors(prev => 
      prev.includes(colorCode) ? prev.filter(c => c !== colorCode) : [...prev, colorCode]
    )
  }

  const productosFiltrados = useMemo(() => {
    const query = (searchParams.get("search") ?? "").trim().toLowerCase()
    return productos.filter((producto) => {
      const categoria = producto.categorias?.nombre ?? "Sin categoría"
      const matchCategoria = selectedCategories.includes("Todos") || selectedCategories.includes(categoria)
      
      const matchSize = selectedSizes.length === 0 || 
        (producto.tallas && producto.tallas.some(t => selectedSizes.includes(t)))

      const matchColor = selectedColors.length === 0 ||
        (producto.colores && producto.colores.some(c => {
           const parts = c.split(":")
           const code = parts.length > 1 ? parts[1]?.trim() : parts[0]?.trim()
           return selectedColors.includes(code)
        }))

      const matchAr = !showArOnly || producto.hasLens

      const price = producto.valor_unitario || 0
      const matchPrice = price >= priceRange[0] && price <= priceRange[1]

      const matchSearch =
        query.length === 0 ||
        producto.nombre.toLowerCase().includes(query) ||
        (producto.sku?.toLowerCase().includes(query) ?? false) ||
        categoria.toLowerCase().includes(query)
      return matchCategoria && matchSearch && matchSize && matchColor && matchAr && matchPrice
    })
  }, [productos, selectedCategories, searchParams, selectedSizes, selectedColors, showArOnly, priceRange])

  const productoDestacado = productosFiltrados.find((p) => p.destacado) ?? null
  const productosRegulares = productoDestacado
    ? productosFiltrados.filter((p) => p.id !== productoDestacado.id)
    : productosFiltrados
  
  const allProducts = useMemo(() => {
    let products = productoDestacado ? [productoDestacado, ...productosRegulares] : productosRegulares
    
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case "precio-asc":
          return (a.valor_unitario || 0) - (b.valor_unitario || 0)
        case "precio-desc":
          return (b.valor_unitario || 0) - (a.valor_unitario || 0)
        case "nuevo":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        case "destacados":
        default:
          // Keep featured first, then sort by date
          if (a.destacado && !b.destacado) return -1
          if (!a.destacado && b.destacado) return 1
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
    })
  }, [productoDestacado, productosRegulares, sortBy])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar Filters - Desktop */}
          <aside 
            className={cn(
              "hidden lg:block flex-shrink-0 transition-all duration-500 ease-in-out overflow-hidden",
              showFilters ? "w-64 opacity-100 mr-8 translate-x-0" : "w-0 opacity-0 mr-0 -translate-x-8"
            )}
          >
            <div className="w-64 space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl font-bold">Filtros</h2>
              </div>
              
              <Accordion type="multiple" defaultValue={["categorias", "tallas", "colores", "tecnologia", "precio"]} className="w-full">
                <AccordionItem value="tecnologia" className="border-none">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Tecnología</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-1">
                      <div 
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer group",
                          showArOnly ? "bg-black" : "hover:bg-black"
                        )}
                        onClick={() => setShowArOnly(!showArOnly)}
                      >
                        <Checkbox 
                          id="ar-filter" 
                          checked={showArOnly}
                          onCheckedChange={(checked) => setShowArOnly(checked as boolean)}
                          className={cn(
                            "border-primary",
                            showArOnly 
                              ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-black" 
                              : "group-hover:border-white"
                          )}
                        />
                        <Label 
                          htmlFor="ar-filter" 
                          className={cn(
                            "text-sm font-medium leading-none cursor-pointer w-full",
                            showArOnly ? "text-white" : "group-hover:text-white"
                          )}
                        >
                          AR/Lentes
                        </Label>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="categorias" className="border-none">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Categoría</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-1 pt-1">
                      <div 
                        className={cn(
                          "flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer group",
                          selectedCategories.includes("Todos") ? "bg-black" : "hover:bg-black"
                        )}
                        onClick={() => toggleCategory("Todos")}
                      >
                        <Checkbox 
                          id="cat-all" 
                          checked={selectedCategories.includes("Todos")}
                          onCheckedChange={() => toggleCategory("Todos")}
                          className={cn(
                            "border-primary",
                            selectedCategories.includes("Todos") 
                              ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-black" 
                              : "group-hover:border-white"
                          )}
                        />
                        <Label 
                          htmlFor="cat-all" 
                          className={cn(
                            "text-sm font-medium leading-none cursor-pointer w-full",
                            selectedCategories.includes("Todos") ? "text-white" : "group-hover:text-white"
                          )}
                        >
                          Todos
                        </Label>
                      </div>
                      {categorias.map((categoria) => (
                        <div 
                          key={categoria.id} 
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer group",
                            selectedCategories.includes(categoria.nombre) ? "bg-black" : "hover:bg-black"
                          )}
                          onClick={() => toggleCategory(categoria.nombre)}
                        >
                          <Checkbox 
                            id={`cat-${categoria.id}`} 
                            checked={selectedCategories.includes(categoria.nombre)}
                            onCheckedChange={() => toggleCategory(categoria.nombre)}
                            className={cn(
                              "border-primary",
                              selectedCategories.includes(categoria.nombre) 
                                ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-black" 
                                : "group-hover:border-white"
                            )}
                          />
                          <Label 
                            htmlFor={`cat-${categoria.id}`} 
                            className={cn(
                              "text-sm font-medium leading-none cursor-pointer w-full",
                              selectedCategories.includes(categoria.nombre) ? "text-white" : "group-hover:text-white"
                            )}
                          >
                            {categoria.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="tallas" className="border-none">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Tallas</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSizes.map((size) => (
                        <div 
                          key={size}
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-md border cursor-pointer transition-all",
                            selectedSizes.includes(size) 
                              ? "bg-black text-white border-black" 
                              : "bg-background hover:border-black"
                          )}
                          onClick={() => toggleSize(size)}
                        >
                          <span className="text-sm font-medium">{size}</span>
                        </div>
                      ))}
                      {availableSizes.length === 0 && (
                        <p className="text-sm text-muted-foreground">No hay tallas disponibles</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="colores" className="border-none">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Colores</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableColors.map(({ code, name }) => (
                        <div 
                          key={code}
                          className={cn(
                            "w-8 h-8 rounded-full border cursor-pointer transition-all relative shadow-sm",
                            selectedColors.includes(code) 
                              ? "ring-2 ring-offset-2 ring-black" 
                              : "hover:scale-110"
                          )}
                          style={{ backgroundColor: code }}
                          onClick={() => toggleColor(code)}
                          title={name}
                        />
                      ))}
                      {availableColors.length === 0 && (
                        <p className="text-sm text-muted-foreground">No hay colores disponibles</p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="precio" className="border-none">
                  <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Rangos de precio</AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-6 px-2 pb-2">
                      {maxPrice > minPrice ? (
                        <Slider
                          defaultValue={[minPrice, maxPrice]}
                          value={priceRange}
                          min={minPrice}
                          max={maxPrice}
                          step={1}
                          onValueChange={(value) => setPriceRange(value as [number, number])}
                          className="mb-4"
                        />
                      ) : (
                        <div className="mb-4 h-1.5 w-full bg-muted rounded-full" />
                      )}
                      <div className="flex items-center justify-center text-sm text-muted-foreground">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span className="mx-2">-</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sticky top-[70px] z-30 bg-background/95 backdrop-blur py-2">
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold">
                  {selectedCategories.includes("Todos") 
                    ? "Todos los Productos" 
                    : selectedCategories.length === 1 
                      ? selectedCategories[0] 
                      : `${selectedCategories.length} Categorías`}
                  <span className="ml-2 text-muted-foreground text-lg font-normal">({allProducts.length})</span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden">
                      <SlidersHorizontal className="mr-2 h-4 w-4" />
                      Filtros
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
                    <div className="py-4">
                      <h2 className="font-display text-xl font-bold mb-6">Filtros</h2>
                      <Accordion type="multiple" defaultValue={["categorias", "tallas", "colores", "tecnologia", "precio"]} className="w-full">
                        <AccordionItem value="tecnologia" className="border-none">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Tecnología</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-1">
                              <div 
                                className={cn(
                                  "flex items-center space-x-2 p-2 rounded-md transition-colors cursor-pointer group",
                                  showArOnly ? "bg-black" : "hover:bg-black"
                                )}
                                onClick={() => setShowArOnly(!showArOnly)}
                              >
                                <Checkbox 
                                  id="mobile-ar-filter" 
                                  checked={showArOnly}
                                  onCheckedChange={(checked) => setShowArOnly(checked as boolean)}
                                  className={cn(
                                    "border-primary",
                                    showArOnly 
                                      ? "border-white data-[state=checked]:bg-white data-[state=checked]:text-black" 
                                      : "group-hover:border-white"
                                  )}
                                />
                                <Label 
                                  htmlFor="mobile-ar-filter" 
                                  className={cn(
                                    "text-sm font-medium leading-none cursor-pointer w-full",
                                    showArOnly ? "text-white" : "group-hover:text-white"
                                  )}
                                >
                                  AR/Lentes
                                </Label>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="categorias" className="border-none">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Categoría</AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="mobile-cat-all" 
                                  checked={selectedCategories.includes("Todos")}
                                  onCheckedChange={() => toggleCategory("Todos")}
                                />
                                <Label htmlFor="mobile-cat-all" className="text-sm font-medium leading-none cursor-pointer">Todos</Label>
                              </div>
                              {categorias.map((categoria) => (
                                <div key={categoria.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`mobile-cat-${categoria.id}`} 
                                    checked={selectedCategories.includes(categoria.nombre)}
                                    onCheckedChange={() => toggleCategory(categoria.nombre)}
                                  />
                                  <Label htmlFor={`mobile-cat-${categoria.id}`} className="text-sm font-medium leading-none cursor-pointer">{categoria.nombre}</Label>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="tallas" className="border-none">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Tallas</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {availableSizes.map((size) => (
                                <div 
                                  key={size}
                                  className={cn(
                                    "flex items-center justify-center w-10 h-10 rounded-md border cursor-pointer transition-all",
                                    selectedSizes.includes(size) 
                                      ? "bg-black text-white border-black" 
                                      : "bg-background hover:border-black"
                                  )}
                                  onClick={() => toggleSize(size)}
                                >
                                  <span className="text-sm font-medium">{size}</span>
                                </div>
                              ))}
                              {availableSizes.length === 0 && (
                                <p className="text-sm text-muted-foreground">No hay tallas disponibles</p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="colores" className="border-none">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Colores</AccordionTrigger>
                          <AccordionContent>
                            <div className="flex flex-wrap gap-2 pt-1">
                              {availableColors.map(({ code, name }) => (
                                <div 
                                  key={code}
                                  className={cn(
                                    "w-8 h-8 rounded-full border cursor-pointer transition-all relative shadow-sm",
                                    selectedColors.includes(code) 
                                      ? "ring-2 ring-offset-2 ring-black" 
                                      : "hover:scale-110"
                                  )}
                                  style={{ backgroundColor: code }}
                                  onClick={() => toggleColor(code)}
                                  title={name}
                                />
                              ))}
                              {availableColors.length === 0 && (
                                <p className="text-sm text-muted-foreground">No hay colores disponibles</p>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="precio" className="border-none">
                          <AccordionTrigger className="text-base font-semibold hover:no-underline py-3">Rangos de precio</AccordionTrigger>
                          <AccordionContent>
                            <div className="pt-6 px-2 pb-2">
                              {maxPrice > minPrice ? (
                                <Slider
                                  defaultValue={[minPrice, maxPrice]}
                                  value={priceRange}
                                  min={minPrice}
                                  max={maxPrice}
                                  step={1}
                                  onValueChange={(value) => setPriceRange(value as [number, number])}
                                  className="mb-4"
                                />
                              ) : (
                                <div className="mb-4 h-1.5 w-full bg-muted rounded-full" />
                              )}
                              <div className="flex items-center justify-center text-sm text-muted-foreground">
                                <span>{formatCurrency(priceRange[0])}</span>
                                <span className="mx-2">-</span>
                                <span>{formatCurrency(priceRange[1])}</span>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </SheetContent>
                </Sheet>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="hidden md:flex text-sm font-medium"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
                  <SlidersHorizontal className="ml-2 h-4 w-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-sm font-medium">
                      Ordenar por
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("destacados")}>Destacados</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("precio-asc")}>Precio: Menor a Mayor</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("precio-desc")}>Precio: Mayor a Menor</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("nuevo")}>Lo más nuevo</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                Cargando productos...
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {allProducts.map((producto) => (
                  <Link
                    key={producto.id}
                    href={`/productos/${producto.id}`}
                    className="group block h-full"
                    onMouseEnter={() => setHoveredCard(producto.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div
                      className={`relative bg-card rounded-xl border border-border overflow-hidden transition-all duration-500 h-full flex flex-col ${
                        hoveredCard === producto.id
                          ? "shadow-xl scale-[1.02] -translate-y-1 border-primary/30"
                          : "shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="relative overflow-hidden bg-accent aspect-[4/5]">
                        <Image
                          src={producto.metadata?.image_url || "/placeholder.svg"}
                          alt={producto.nombre}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-60" />

                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {producto.destacado && (
                            <Badge className="bg-primary text-primary-foreground border-0 shadow-lg text-[10px] md:text-xs">
                              Destacado
                            </Badge>
                          )}
                          {producto.nuevo && !producto.destacado && (
                            <Badge className="bg-primary text-primary-foreground border-0 shadow-lg text-[10px] md:text-xs">
                              Nuevo
                            </Badge>
                          )}
                          {producto.hasLens && (
                            <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-500 shadow-lg text-[10px] md:text-xs">
                              <Sparkles className="mr-1 h-3 w-3" /> AR
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex flex-col flex-1">
                        <div className="mb-2">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 h-5">
                            {producto.categorias?.nombre ?? "General"}
                          </Badge>
                        </div>
                        
                        <h3 className="font-display text-lg font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {producto.nombre}
                        </h3>
                        
                        <div className="h-6 mb-2 flex items-center gap-1.5">
                          {hoveredCard === producto.id && producto.colores && producto.colores.length > 0 ? (
                            producto.colores.map((colorStr, idx) => {
                              const parts = colorStr.split(":")
                              const code = parts.length > 1 ? parts[1] : parts[0]
                              return (
                                <div 
                                  key={idx} 
                                  className="h-4 w-4 rounded-full border border-border shadow-sm" 
                                  style={{ backgroundColor: code }} 
                                  title={code}
                                />
                              )
                            })
                          ) : null}
                        </div>
                        
                        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                          <span className="font-display text-lg font-bold text-foreground">
                            {formatCurrency(producto.valor_unitario)}
                          </span>
                          <Button size="sm" className="h-8 rounded-full px-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            Ver
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {!loading && allProducts.length === 0 && (
              <div className="text-center py-24">
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">No se encontraron productos</h3>
                <p className="text-muted-foreground">Intenta ajustar los filtros de búsqueda</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function esNuevo(created_at?: string) {
  if (!created_at) return false
  const created = new Date(created_at)
  const now = new Date()
  const diff = now.getTime() - created.getTime()
  const days = diff / (1000 * 60 * 60 * 24)
  return days <= 14
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "--"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

function getProductLensId(producto?: Producto | null): string {
  const asset = getPrimaryLensAsset(producto)
  if (asset) {
    const metadata = asset.metadata && typeof asset.metadata === "object" ? asset.metadata : null
    if (metadata) {
      const candidates = [metadata.lens_id, metadata.lensId, metadata.id]
      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
          return candidate.trim()
        }
      }
    }

    const fromUrl = extractLensIdFromUrl(asset.url)
    if (fromUrl) {
      return fromUrl
    }
  }

  const fallback = typeof producto?.metadata?.lensId === "string" ? producto.metadata.lensId.trim() : ""
  return fallback
}

function getPrimaryLensAsset(producto?: Producto | null): LensAsset | null {
  if (!producto) return null
  const assets = Array.isArray(producto.lens_assets) ? producto.lens_assets : []
  if (!assets.length) return null

  const active = assets.filter((asset) => asset && asset.activo !== false)
  if (!active.length) return null

  const snapLens = active.find(
    (asset) => (asset.provider ?? "").toLowerCase() === "snap" && (asset.tipo ?? "").toLowerCase() === "lens"
  )
  if (snapLens) {
    return snapLens
  }

  const anyLens = active.find((asset) => (asset.tipo ?? "").toLowerCase() === "lens")
  if (anyLens) {
    return anyLens
  }

  return active[0] ?? null
}

function extractLensIdFromUrl(value?: string | null): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  const uuidPattern = /^[0-9a-fA-F-]{32,}$/
  if (uuidPattern.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const paramCandidates = ["lensId", "lens_id", "id"]
    for (const key of paramCandidates) {
      const candidate = parsed.searchParams.get(key)
      if (candidate) {
        const normalized = candidate.trim()
        if (normalized && uuidPattern.test(normalized)) {
          return normalized
        }
      }
    }

    const segments = parsed.pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (lastSegment && uuidPattern.test(lastSegment)) {
      return lastSegment
    }
  } catch {
    // ignore
  }

  return ""
}
