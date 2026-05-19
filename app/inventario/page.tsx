"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus,
  Search,
  Eye,
  ShoppingBag,
  MoreVertical,
  TrendingUp,
  Loader2,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  createProduct as createInventoryProduct,
  deleteProduct as deleteInventoryProduct,
  deleteProductStock as deleteInventoryStock,
  fetchInventoryOverview,
  type InventoryCategory,
  type InventoryItem,
  type InventoryLocation,
  type InventoryProduct,
  upsertProductStock as upsertInventoryStock,
  updateProduct as updateInventoryProduct,
} from "@/lib/services/inventory"

import { MetricCard } from "@/components/inventory/metric-card"
import { LocationDialog } from "@/components/inventory/location-dialog"
import { ProductDialog } from "@/components/inventory/product-dialog"
import { StockDialog } from "@/components/inventory/stock-dialog"
import { type ProductFormState, type StockFormState } from "@/components/inventory/types"
import {
  getInitialProductForm,
  getInitialStockForm,
  buildProductMetadata,
  buildLensAssetPayload,
  getProductLensId,
} from "@/components/inventory/utils"
import { extractLensIdFromUrl } from "@/components/virtual-try-on/types"
import { AdminGuard } from "@/components/auth/admin-guard"

const ALL_LOCATIONS_VALUE = "all"

export default function InventarioPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [productos, setProductos] = useState<InventoryProduct[]>([])
  const [categorias, setCategorias] = useState<InventoryCategory[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [locations, setLocations] = useState<InventoryLocation[]>([])
  const [locationFilterId, setLocationFilterId] = useState<string>(ALL_LOCATIONS_VALUE)
  const [loading, setLoading] = useState(true)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingStock, setSavingStock] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [productoEnEdicion, setProductoEnEdicion] = useState<InventoryProduct | null>(null)
  const [productoStock, setProductoStock] = useState<InventoryProduct | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>(getInitialProductForm())
  const [stockForm, setStockForm] = useState<StockFormState>(getInitialStockForm())
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [, setLocationDialogContext] = useState<{ onCreated?: (location: InventoryLocation) => void } | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { products, categories, locations: fetchedLocations } = await fetchInventoryOverview()
      setProductos(products)
      setCategorias(categories)
      setLocations(sortLocations(fetchedLocations))
      setLocationFilterId((current) => {
        if (current === ALL_LOCATIONS_VALUE) return current
        return fetchedLocations.some((location) => location.id === current) ? current : ALL_LOCATIONS_VALUE
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar datos"
      if (message === "No autorizado" || message === "Permisos insuficientes") {
        router.replace("/")
        return
      }
      toast({ title: "Error al cargar datos", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (productDialogOpen) return
    const defaultLocationId = locations[0]?.id ?? ""
    setProductoEnEdicion(null)
    setProductForm(getInitialProductForm({ locationId: defaultLocationId }))
  }, [productDialogOpen, locations])

  useEffect(() => {
    if (stockDialogOpen) return
    const defaultLocationId = locations[0]?.id ?? ""
    setProductoStock(null)
    setStockForm(getInitialStockForm({ locationId: defaultLocationId }))
  }, [stockDialogOpen, locations])

  const openLocationDialog = useCallback((onCreated?: (location: InventoryLocation) => void) => {
    setLocationDialogContext({ onCreated })
    setLocationDialogOpen(true)
  }, [])

  const handleLocationCreated = useCallback((location: InventoryLocation) => {
    setLocations((prev) => sortLocations([...prev.filter((item) => item.id !== location.id), location]))
    setLocationDialogOpen(false)
    setLocationDialogContext((current) => {
      current?.onCreated?.(location)
      return null
    })
  }, [])

  const categoriasFiltro = useMemo(() => ["Todos", ...categorias.map((c) => c.nombre)], [categorias])
  const MAX_VISIBLE_CATEGORIES = 6
  const categoriasVisibles = useMemo(
    () => categoriasFiltro.slice(0, MAX_VISIBLE_CATEGORIES),
    [categoriasFiltro]
  )
  const categoriasOcultas = useMemo(
    () => categoriasFiltro.slice(MAX_VISIBLE_CATEGORIES),
    [categoriasFiltro]
  )
  const categoriaOcultaSeleccionada = useMemo(
    () => categoriasOcultas.includes(categoriaActiva),
    [categoriaActiva, categoriasOcultas]
  )

  const effectiveLocationId = locationFilterId === ALL_LOCATIONS_VALUE ? undefined : locationFilterId

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const categoriaNombre = p.categorias?.nombre ?? "Sin categoría"
      const matchCategoria = categoriaActiva === "Todos" || categoriaNombre === categoriaActiva
      const query = searchQuery.trim().toLowerCase()
      const matchSearch =
        query.length === 0 ||
        p.nombre.toLowerCase().includes(query) ||
        (p.sku?.toLowerCase().includes(query) ?? false) ||
        categoriaNombre.toLowerCase().includes(query)
      const matchLocation =
        !effectiveLocationId ||
        (Array.isArray(p.inventario_items) &&
          p.inventario_items.some(
            (item) => item.bodega_id === effectiveLocationId || item.bodega?.id === effectiveLocationId
          ))
      return matchCategoria && matchSearch && matchLocation
    })
  }, [categoriaActiva, effectiveLocationId, productos, searchQuery])

  const totalStock = useMemo(
    () => productos.reduce((acc, p) => acc + sumStock(p.inventario_items, effectiveLocationId), 0),
    [effectiveLocationId, productos]
  )

  const totalValor = useMemo(
    () =>
      productos.reduce((acc, p) => {
        const stock = sumStock(p.inventario_items, effectiveLocationId)
        return acc + stock * (p.valor_unitario ?? 0)
      }, 0),
    [effectiveLocationId, productos]
  )

  const abrirModalNuevoProducto = () => {
    setProductoEnEdicion(null)
    const defaultLocationId = locations[0]?.id ?? ""
    setProductForm(getInitialProductForm({ locationId: defaultLocationId }))
    setProductDialogOpen(true)
  }

  const abrirModalEditarProducto = (producto: InventoryProduct) => {
    setProductoEnEdicion(producto)
    const metadataImageUrl = producto.metadata?.image_url
    const productLensId = getProductLensId(producto)
    const primerItem = producto.inventario_items?.[0]
    const fallbackLocationId =
      primerItem?.bodega_id ?? primerItem?.bodega?.id ?? locations[0]?.id ?? ""
    
    const tallas = Array.isArray(producto.tallas) 
      ? (producto.tallas as string[]).join(", ") 
      : typeof producto.tallas === "string" 
        ? producto.tallas 
        : ""

    const colores = Array.isArray(producto.colores)
      ? (producto.colores as string[]).join(",")
      : typeof producto.colores === "string"
        ? producto.colores
        : ""

    // Map existing inventory items to form state
    const inventory = (producto.inventario_items || []).map(item => ({
      locationId: item.bodega_id || item.bodega?.id || "",
      quantity: item.cantidad || 0
    }))

    // Map existing lens assets to form state
    const lenses = (producto.lens_assets || []).map(asset => {
      const metadata = asset.metadata as any || {}
      return {
        id: asset.id,
        lensId: metadata.lens_id || metadata.lensId || extractLensIdFromUrl(asset.url) || "",
        colorCode: metadata.color_code || metadata.colorCode || ""
      }
    })

    setProductForm({
      id: producto.id,
      nombre: producto.nombre ?? "",
      sku: producto.sku ?? "",
      categoriaId: producto.categoria_id ?? "",
      precio: producto.valor_unitario?.toString() ?? "",
      descripcion: producto.descripcion ?? "",
      estado: producto.estado ?? "disponible",
      destacado: Boolean(producto.destacado),
      imageUrl: typeof metadataImageUrl === "string" ? metadataImageUrl : "",
      lensId: productLensId,
      stockInicial: "0",
      bodegaId: fallbackLocationId,
      tallas,
      colores,
      inventory,
      lenses,
    })
    setProductDialogOpen(true)
  }

  const abrirModalStock = (producto: InventoryProduct) => {
    const primerItem = producto.inventario_items?.[0]
    const defaultLocationId =
      primerItem?.bodega_id ??
      primerItem?.bodega?.id ??
      (effectiveLocationId ?? locations[0]?.id ?? "")
    setProductoStock(producto)
    setStockForm({
      productId: producto.id,
      itemId: primerItem?.id ?? null,
      bodegaId: defaultLocationId,
      cantidad: primerItem?.cantidad?.toString() ?? "0",
      cantidadMinima: primerItem?.cantidad_minima?.toString() ?? "0",
      estado: primerItem?.estado ?? "ok",
    })
    setStockDialogOpen(true)
  }

  const handleGuardarProducto = async () => {
    if (!productForm.nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    // Validate inventory if adding new product
    if (!productoEnEdicion && (!productForm.inventory || productForm.inventory.length === 0)) {
       // Optional: Allow creating without stock? Yes, usually.
    }

    setSavingProduct(true)
    const metadata = buildProductMetadata(productForm, productoEnEdicion?.metadata ?? null)
    // Legacy lens asset builder, we might still use it if lenses array is empty but lensId is set (backward compat)
    const lensAsset = buildLensAssetPayload(productForm, productoEnEdicion)
    
    const tallas = productForm.tallas.split(",").map(t => t.trim()).filter(t => t.length > 0)
    const colores = productForm.colores.split(",").filter(c => c.trim().length > 0)

    const basePayload = {
      nombre: productForm.nombre.trim(),
      sku: productForm.sku.trim() || null,
      categoria_id: productForm.categoriaId || null,
      valor_unitario: productForm.precio ? Number(productForm.precio) : null,
      descripcion: productForm.descripcion.trim() || null,
      estado: productForm.estado,
      destacado: productForm.destacado,
      metadata,
      tallas: tallas.length > 0 ? tallas : null,
      colores: colores.length > 0 ? colores : null,
      lensAsset,
      lenses: productForm.lenses, // Send the new lenses array
      inventory: productForm.inventory, // Send the inventory array for updates too
    }

    try {
      if (productoEnEdicion) {
        await updateInventoryProduct(productoEnEdicion.id, basePayload)
      } else {
        const payload = {
          ...basePayload,
          stockInicial: 0, // Deprecated
          stockLocationId: null, // Deprecated
        }
        await createInventoryProduct(payload)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar"
      toast({ title: "No pudimos guardar", description: message, variant: "destructive" })
      setSavingProduct(false)
      return
    }

    toast({
      title: productoEnEdicion ? "Producto actualizado" : "Producto creado",
      description: productoEnEdicion
        ? "Los datos se guardaron correctamente"
        : "Agregamos el producto al inventario",
    })

    setProductDialogOpen(false)
    setSavingProduct(false)
    await fetchData()
  }

  const handleEliminarProducto = async (producto: InventoryProduct) => {
    if (!confirm(`¿Eliminar ${producto.nombre}? Esta acción no se puede deshacer.`)) return
    try {
      await deleteInventoryProduct(producto.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar"
      toast({ title: "Error al eliminar", description: message, variant: "destructive" })
      return
    }
    toast({ title: "Producto eliminado" })
    await fetchData()
  }

  const handleGuardarStock = async () => {
    if (!stockForm.productId) return
    const cantidad = Number(stockForm.cantidad)
    if (Number.isNaN(cantidad) || cantidad < 0) {
      toast({ title: "Cantidad inválida", variant: "destructive" })
      return
    }
    if (!stockForm.bodegaId) {
      toast({
        title: "Selecciona una bodega",
        description: "Debes elegir en qué bodega se encuentra el stock.",
        variant: "destructive",
      })
      return
    }

    setSavingStock(true)
    const payload = {
      itemId: stockForm.itemId,
      bodegaId: stockForm.bodegaId,
      cantidad,
      cantidad_minima: Number(stockForm.cantidadMinima) || 0,
      estado: stockForm.estado,
    }

    try {
      await upsertInventoryStock(stockForm.productId, payload)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al guardar stock"
      toast({ title: "Error al guardar stock", description: message, variant: "destructive" })
      setSavingStock(false)
      return
    }

    toast({ title: "Stock actualizado" })
    setSavingStock(false)
    setStockDialogOpen(false)
    await fetchData()
  }

  const handleEliminarStock = async () => {
    if (!stockForm.itemId) return
    if (!confirm("¿Eliminar este registro de inventario?")) return
    try {
      await deleteInventoryStock(stockForm.productId, stockForm.itemId)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar stock"
      toast({ title: "Error al eliminar stock", description: message, variant: "destructive" })
      return
    }
    toast({ title: "Registro de inventario eliminado" })
    setStockDialogOpen(false)
    await fetchData()
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background overflow-x-hidden">

        <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gestión de Productos</p>
            </div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Inventario</h1>
            <p className="text-lg text-muted-foreground">Administra tu catálogo de productos y existencias</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MetricCard label="Total Productos" value={productosFiltrados.length.toString()} />
            <MetricCard label="Unidades en Stock" value={totalStock.toString()} />
            <MetricCard label="Valor Total" value={`$${totalValor.toLocaleString()}`} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, categoría o SKU..."
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
                className="pl-10 h-11 bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={locationFilterId} onValueChange={setLocationFilterId}>
                <SelectTrigger className="w-[200px] bg-background">
                  <SelectValue placeholder="Todas las bodegas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_LOCATIONS_VALUE}>Todas las bodegas</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() =>
                  openLocationDialog((location) => {
                    setLocationFilterId((current) =>
                      current === ALL_LOCATIONS_VALUE ? location.id : current
                    )
                  })
                }
              >
                <Plus className="h-4 w-4" />
                Nueva bodega
              </Button>
              <Button
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={abrirModalNuevoProducto}
              >
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categoriasVisibles.map((cat) => (
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
            {categoriasOcultas.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={`px-4 py-1.5 h-auto rounded-lg text-sm font-medium transition-all bg-muted text-foreground gap-2 ${
                      categoriaOcultaSeleccionada ? "border-primary/60 text-primary" : "hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    Más categorías
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-[12rem]">
                  {categoriasOcultas.map((cat) => (
                    <DropdownMenuItem
                      key={cat}
                      onSelect={() => setCategoriaActiva(cat)}
                      className={categoriaActiva === cat ? "bg-primary/10 text-primary" : ""}
                    >
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              Cargando inventario...
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[780px]">
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
                  {productosFiltrados.map((producto) => {
                    const stock = sumStock(producto.inventario_items, effectiveLocationId)
                    const categoriaNombre = producto.categorias?.nombre ?? "Sin categoría"
                    const precio = producto.valor_unitario ?? 0
                    const rawImage = producto.metadata?.image_url
                    const imagen = typeof rawImage === "string" && rawImage.length > 0 ? rawImage : "/placeholder.svg"
                    const hasLens = getProductLensId(producto).length > 0

                    return (
                      <TableRow key={producto.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <Image
                                src={imagen}
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
                                  <TrendingUp className="h-3 w-3 mr-1" /> Destacado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm text-muted-foreground font-mono">{producto.sku ?? "—"}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {categoriaNombre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[120px]">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    stock === 0 ? "bg-warning" : stock < 20 ? "bg-chart-3" : "bg-success"
                                  }`}
                                  style={{ width: `${Math.min(stock, 100)}%` }}
                                />
                              </div>
                            </div>
                            <span className={`text-sm font-medium ${stock < 20 ? "text-warning" : "text-foreground"}`}>
                              {stock}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-foreground">
                            {precio ? `$${precio.toFixed(2)}` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-success/10 text-success border-success/20 capitalize">{producto.estado}</Badge>
                            {hasLens ? (
                              <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-500">Lens</Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirModalEditarProducto(producto)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar producto
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => abrirModalStock(producto)}>
                                <Warehouse className="h-4 w-4 mr-2" /> Gestionar stock
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={() => handleEliminarProducto(producto)}>
                                <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/productos/${producto.id}`} className="flex items-center">
                                  <Eye className="h-4 w-4 mr-2" /> Ver detalles
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && productosFiltrados.length === 0 ? (
            <div className="border-t border-border py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-foreground">No se encontraron productos</h3>
              <p className="mb-6 text-muted-foreground">
                Intenta ajustar los filtros o agrega nuevos productos al inventario
              </p>
              <Button className="gap-2" onClick={abrirModalNuevoProducto}>
                <Plus className="h-4 w-4" /> Agregar Producto
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        categorias={categorias}
        locations={locations}
        productForm={productForm}
        onFormChange={setProductForm}
        onSubmit={handleGuardarProducto}
        saving={savingProduct}
        isEditing={Boolean(productoEnEdicion)}
        onRequestNewLocation={() =>
          openLocationDialog((location) => {
            setProductForm((prev) => ({ ...prev, bodegaId: location.id }))
          })
        }
      />

      <StockDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={productoStock}
        locations={locations}
        stockForm={stockForm}
        onFormChange={setStockForm}
        saving={savingStock}
        onSubmit={handleGuardarStock}
        onDelete={handleEliminarStock}
        onRequestNewLocation={() =>
          openLocationDialog((location) => {
            setStockForm((prev) => ({ ...prev, bodegaId: location.id, itemId: prev.itemId ?? null }))
          })
        }
      />

        <LocationDialog
          open={locationDialogOpen}
          onOpenChange={(open: boolean) => {
            setLocationDialogOpen(open)
            if (!open) {
              setLocationDialogContext(null)
            }
          }}
          onCreated={handleLocationCreated}
        />
      </div>
    </AdminGuard>
  )
}function sortLocations(locations: InventoryLocation[]) {
  return [...locations].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
}

function sumStock(items: InventoryItem[], locationId?: string) {
  if (!Array.isArray(items)) return 0
  return items.reduce((acc, item) => {
    if (locationId && item.bodega_id !== locationId && item.bodega?.id !== locationId) {
      return acc
    }
    return acc + (item.cantidad ?? 0)
  }, 0)
}

