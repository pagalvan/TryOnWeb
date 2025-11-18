"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Plus,
  Search,
  Eye,
  ShoppingBag,
  Filter,
  Download,
  MoreVertical,
  TrendingUp,
  Loader2,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  createProduct as createInventoryProduct,
  deleteProduct as deleteInventoryProduct,
  deleteProductStock as deleteInventoryStock,
  fetchInventoryOverview,
  type InventoryCategory,
  type InventoryItem,
  type InventoryProduct,
  upsertProductStock as upsertInventoryStock,
  updateProduct as updateInventoryProduct,
} from "@/lib/services/inventory"

const PRODUCT_STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "inactiva", label: "Inactiva" },
]

const INVENTORY_STATUS_OPTIONS = [
  { value: "ok", label: "OK" },
  { value: "bajo", label: "Bajo" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "bloqueado", label: "Bloqueado" },
]

const DEFAULT_LOCATION = "Bodega Principal"

type ProductFormState = {
  id: string | null
  nombre: string
  sku: string
  categoriaId: string
  precio: string
  descripcion: string
  estado: string
  destacado: boolean
  imageUrl: string
  stockInicial: string
  ubicacion: string
}

type StockFormState = {
  productId: string
  itemId: string | null
  ubicacion: string
  cantidad: string
  cantidadMinima: string
  estado: string
}

export default function InventarioPage() {
  const { toast } = useToast()
  const [productos, setProductos] = useState<InventoryProduct[]>([])
  const [categorias, setCategorias] = useState<InventoryCategory[]>([])
  const [categoriaActiva, setCategoriaActiva] = useState<string>("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [savingProduct, setSavingProduct] = useState(false)
  const [savingStock, setSavingStock] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [stockDialogOpen, setStockDialogOpen] = useState(false)
  const [productoEnEdicion, setProductoEnEdicion] = useState<InventoryProduct | null>(null)
  const [productoStock, setProductoStock] = useState<InventoryProduct | null>(null)
  const [productForm, setProductForm] = useState<ProductFormState>(getInitialProductForm())
  const [stockForm, setStockForm] = useState<StockFormState>(getInitialStockForm())

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const { products, categories } = await fetchInventoryOverview()
      setProductos(products)
      setCategorias(categories)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar datos"
      toast({ title: "Error al cargar datos", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (productDialogOpen) return
    setProductoEnEdicion(null)
    setProductForm(getInitialProductForm())
  }, [productDialogOpen])

  useEffect(() => {
    if (stockDialogOpen) return
    setProductoStock(null)
    setStockForm(getInitialStockForm())
  }, [stockDialogOpen])

  const categoriasFiltro = useMemo(() => ["Todos", ...categorias.map((c) => c.nombre)], [categorias])

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
      return matchCategoria && matchSearch
    })
  }, [categoriaActiva, productos, searchQuery])

  const totalStock = useMemo(
    () => productos.reduce((acc, p) => acc + sumStock(p.inventario_items), 0),
    [productos]
  )
  const totalValor = useMemo(
    () =>
      productos.reduce((acc, p) => {
        const stock = sumStock(p.inventario_items)
        return acc + stock * (p.valor_unitario ?? 0)
      }, 0),
    [productos]
  )

  const abrirModalNuevoProducto = () => {
    setProductoEnEdicion(null)
    setProductForm(getInitialProductForm())
    setProductDialogOpen(true)
  }

  const abrirModalEditarProducto = (producto: InventoryProduct) => {
    setProductoEnEdicion(producto)
    const metadataImageUrl = producto.metadata?.image_url
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
      stockInicial: "0",
      ubicacion: DEFAULT_LOCATION,
    })
    setProductDialogOpen(true)
  }

  const abrirModalStock = (producto: InventoryProduct) => {
    const primerItem = producto.inventario_items?.[0]
    setProductoStock(producto)
    setStockForm({
      productId: producto.id,
      itemId: primerItem?.id ?? null,
      ubicacion: primerItem?.ubicacion ?? DEFAULT_LOCATION,
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

    setSavingProduct(true)
    const basePayload = {
      nombre: productForm.nombre.trim(),
      sku: productForm.sku.trim() || null,
      categoria_id: productForm.categoriaId || null,
      valor_unitario: productForm.precio ? Number(productForm.precio) : null,
      descripcion: productForm.descripcion.trim() || null,
      estado: productForm.estado,
      destacado: productForm.destacado,
      metadata: productForm.imageUrl ? { image_url: productForm.imageUrl.trim() } : null,
    }

    try {
      if (productoEnEdicion) {
        await updateInventoryProduct(productoEnEdicion.id, basePayload)
      } else {
        const payload = {
          ...basePayload,
          stockInicial: Number(productForm.stockInicial) || 0,
          ubicacion: productForm.ubicacion || DEFAULT_LOCATION,
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

    setSavingStock(true)
    const payload = {
      itemId: stockForm.itemId,
      ubicacion: stockForm.ubicacion || DEFAULT_LOCATION,
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gestión de Productos</p>
            </div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Inventario</h1>
            <p className="text-lg text-muted-foreground">Administra tu catálogo de productos y existencias</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <MetricCard label="Total Productos" value={productos.length.toString()} />
            <MetricCard label="Unidades en Stock" value={totalStock.toString()} />
            <MetricCard label="Valor Total" value={`$${totalValor.toLocaleString()}`} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, categoría o SKU..."
                value={searchQuery}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)}
                className="pl-10 h-11 bg-background"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={abrirModalNuevoProducto}>
                <Plus className="h-4 w-4" />
                Nuevo Producto
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {categoriasFiltro.map((cat) => (
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

        <div className="bg-card border border-border rounded-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-3" />
              Cargando inventario...
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table className="min-w-[720px]">
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
                    const stock = sumStock(producto.inventario_items)
                    const categoriaNombre = producto.categorias?.nombre ?? "Sin categoría"
                    const precio = producto.valor_unitario ?? 0
                    const rawImage = producto.metadata?.image_url
                    const imagen = typeof rawImage === "string" && rawImage.length > 0 ? rawImage : "/placeholder.svg"

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
                            <div className="flex-1 max-w-[100px]">
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
                          <Badge className="bg-success/10 text-success border-success/20 capitalize">{producto.estado}</Badge>
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
        productForm={productForm}
        onFormChange={setProductForm}
        onSubmit={handleGuardarProducto}
        saving={savingProduct}
        isEditing={Boolean(productoEnEdicion)}
      />

      <StockDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={productoStock}
        stockForm={stockForm}
        onFormChange={setStockForm}
        saving={savingStock}
        onSubmit={handleGuardarStock}
        onDelete={handleEliminarStock}
      />
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-3">
      <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function sumStock(items: InventoryItem[]) {
  if (!Array.isArray(items)) return 0
  return items.reduce((acc, item) => acc + (item.cantidad ?? 0), 0)
}

function getInitialProductForm(): ProductFormState {
  return {
    id: null,
    nombre: "",
    sku: "",
    categoriaId: "",
    precio: "",
    descripcion: "",
    estado: "disponible",
    destacado: false,
    imageUrl: "",
    stockInicial: "0",
    ubicacion: DEFAULT_LOCATION,
  }
}

function getInitialStockForm(): StockFormState {
  return {
    productId: "",
    itemId: null,
    ubicacion: DEFAULT_LOCATION,
    cantidad: "0",
    cantidadMinima: "0",
    estado: "ok",
  }
}

type ProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: InventoryCategory[]
  productForm: ProductFormState
  onFormChange: (value: ProductFormState) => void
  onSubmit: () => void
  saving: boolean
  isEditing: boolean
}

function ProductDialog({ open, onOpenChange, categorias, productForm, onFormChange, onSubmit, saving, isEditing }: ProductDialogProps) {
  const handleChange = (field: keyof ProductFormState, value: string | boolean) => {
    onFormChange({ ...productForm, [field]: value })
  }

  const handleInputChange = (field: keyof ProductFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(field, event.target.value)
    }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={productForm.nombre} onChange={handleInputChange("nombre")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={productForm.sku} onChange={handleInputChange("sku")} />
          </div>

          <div className="grid gap-2">
            <Label>Categoría</Label>
            <Select value={productForm.categoriaId} onValueChange={(value: string) => handleChange("categoriaId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Precio (valor unitario)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={productForm.precio}
              onChange={handleInputChange("precio")}
            />
          </div>

          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea value={productForm.descripcion} onChange={handleInputChange("descripcion")} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={productForm.estado} onValueChange={(value: string) => handleChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
              <div>
                <Label className="text-sm font-medium">Destacado</Label>
                <p className="text-xs text-muted-foreground">Aparece primero en la lista</p>
              </div>
              <Switch checked={productForm.destacado} onCheckedChange={(checked: boolean) => handleChange("destacado", checked)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Imagen (URL)</Label>
            <Input placeholder="https://..." value={productForm.imageUrl} onChange={handleInputChange("imageUrl")} />
          </div>

          {!isEditing && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Stock inicial</Label>
                <Input type="number" min="0" value={productForm.stockInicial} onChange={handleInputChange("stockInicial")} />
              </div>
              <div className="grid gap-2">
                <Label>Ubicación</Label>
                <Input value={productForm.ubicacion} onChange={handleInputChange("ubicacion")} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type StockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: InventoryProduct | null
  stockForm: StockFormState
  onFormChange: (value: StockFormState) => void
  onSubmit: () => void
  onDelete: () => void
  saving: boolean
}

function StockDialog({ open, onOpenChange, product, stockForm, onFormChange, onSubmit, onDelete, saving }: StockDialogProps) {
  if (!product) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>Selecciona un producto</DialogContent>
      </Dialog>
    )
  }

  const handleChange = (field: keyof StockFormState, value: string) => {
    onFormChange({ ...stockForm, [field]: value })
  }

  const handleInputChange = (field: keyof StockFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(field, event.target.value)
  }

  const existingItems = product.inventario_items || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Inventario de {product.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {existingItems.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border">
              {existingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left p-4 flex items-center justify-between ${
                    stockForm.itemId === item.id ? "bg-muted/50" : "bg-card"
                  }`}
                  onClick={() =>
                    onFormChange({
                      ...stockForm,
                      itemId: item.id,
                      ubicacion: item.ubicacion,
                      cantidad: item.cantidad?.toString() ?? "0",
                      cantidadMinima: item.cantidad_minima?.toString() ?? "0",
                      estado: item.estado ?? "ok",
                    })
                  }
                >
                  <div>
                    <p className="font-medium">{item.ubicacion}</p>
                    <p className="text-sm text-muted-foreground">{item.cantidad} unidades</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {item.estado ?? "ok"}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Ubicación</Label>
              <Input value={stockForm.ubicacion} onChange={handleInputChange("ubicacion")} />
            </div>
            <div className="grid gap-2">
              <Label>Cantidad</Label>
              <Input type="number" min="0" value={stockForm.cantidad} onChange={handleInputChange("cantidad")} />
            </div>
            <div className="grid gap-2">
              <Label>Cantidad mínima</Label>
              <Input
                type="number"
                min="0"
                value={stockForm.cantidadMinima}
                onChange={handleInputChange("cantidadMinima")}
              />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={stockForm.estado} onValueChange={(value: string) => handleChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-1 items-center justify-between gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              {stockForm.itemId && (
                <Button variant="destructive" onClick={onDelete}>
                  Eliminar registro
                </Button>
              )}
              <Button onClick={onSubmit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
