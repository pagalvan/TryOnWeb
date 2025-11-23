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
	Wand2,
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
	createInventoryLocation,
	type InventoryCategory,
	type InventoryItem,
	type InventoryLocation,
	type InventoryProduct,
	type InventoryProductMetadata,
	upsertProductStock as upsertInventoryStock,
	updateProduct as updateInventoryProduct,
 	type LensAsset,
 	type LensAssetInput,
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
const ALL_LOCATIONS_VALUE = "all"

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
	lensId: string
	stockInicial: string
	bodegaId: string
}

type StockFormState = {
	productId: string
	itemId: string | null
	bodegaId: string
	cantidad: string
	cantidadMinima: string
	estado: string
}

type InitialFormOptions = {
	locationId?: string
}

export default function InventarioPage() {
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

		const stockInicialNumber = Number(productForm.stockInicial) || 0
		if (!productoEnEdicion && stockInicialNumber > 0 && !productForm.bodegaId) {
			toast({
				title: "Selecciona una bodega",
				description: "El stock inicial requiere una bodega asignada.",
				variant: "destructive",
			})
			return
		}

		setSavingProduct(true)
		const metadata = buildProductMetadata(productForm, productoEnEdicion?.metadata ?? null)
		const lensAsset = buildLensAssetPayload(productForm, productoEnEdicion)
		const basePayload = {
			nombre: productForm.nombre.trim(),
			sku: productForm.sku.trim() || null,
			categoria_id: productForm.categoriaId || null,
			valor_unitario: productForm.precio ? Number(productForm.precio) : null,
			descripcion: productForm.descripcion.trim() || null,
			estado: productForm.estado,
			destacado: productForm.destacado,
			metadata,
			lensAsset,
		}

		try {
			if (productoEnEdicion) {
				await updateInventoryProduct(productoEnEdicion.id, basePayload)
			} else {
				const payload = {
					...basePayload,
					stockInicial: stockInicialNumber,
					stockLocationId: productForm.bodegaId || null,
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

function sumStock(items: InventoryItem[], locationId?: string) {
	if (!Array.isArray(items)) return 0
	return items.reduce((acc, item) => {
		if (locationId && item.bodega_id !== locationId && item.bodega?.id !== locationId) {
			return acc
		}
		return acc + (item.cantidad ?? 0)
	}, 0)
}

function getInitialProductForm(options: InitialFormOptions = {}): ProductFormState {
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
		lensId: "",
		stockInicial: "0",
		bodegaId: options.locationId ?? "",
	}
}

function getInitialStockForm(options: InitialFormOptions = {}): StockFormState {
	return {
		productId: "",
		itemId: null,
		bodegaId: options.locationId ?? "",
		cantidad: "0",
		cantidadMinima: "0",
		estado: "ok",
	}
}

type ProductDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	categorias: InventoryCategory[]
	locations: InventoryLocation[]
	productForm: ProductFormState
	onFormChange: (value: ProductFormState) => void
	onSubmit: () => void
	saving: boolean
	isEditing: boolean
	onRequestNewLocation: () => void
}

function ProductDialog({
	open,
	onOpenChange,
	categorias,
	locations,
	productForm,
	onFormChange,
	onSubmit,
	saving,
	isEditing,
	onRequestNewLocation,
}: ProductDialogProps) {
	const handleChange = (field: keyof ProductFormState, value: string | boolean) => {
		onFormChange({ ...productForm, [field]: value })
	}

	const handleInputChange =
		(field: keyof ProductFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			handleChange(field, event.target.value)
		}

	const canAddStock = !isEditing && locations.length > 0

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
						<div className="flex gap-2">
							<Input id="sku" value={productForm.sku} onChange={handleInputChange("sku")} placeholder="Código único" />
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => {
									const cat = categorias.find((c) => c.id === productForm.categoriaId)
									const catPrefix = (cat?.nombre || "GEN").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "X")
									const namePrefix = (productForm.nombre || "PRO").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "X")
									const random = Math.random().toString(36).substring(2, 6).toUpperCase()
									const newSku = `${catPrefix}-${namePrefix}-${random}`
									handleChange("sku", newSku)
								}}
								title="Generar SKU automático"
							>
								<Wand2 className="h-4 w-4" />
							</Button>
						</div>
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
						<Input type="number" min="0" step="0.01" value={productForm.precio} onChange={handleInputChange("precio")} />
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

					<div className="grid gap-2">
						<Label>Lens ID (Snap)</Label>
						<Input
							placeholder="52e517f6-79f2-438d-9279-02dd6d46b887"
							value={productForm.lensId}
							onChange={handleInputChange("lensId")}
						/>
						<p className="text-xs text-muted-foreground">Este identificador proviene de Lens Studio y habilita la experiencia AR.</p>
					</div>

					{!isEditing && (
						<div className="grid md:grid-cols-2 gap-4">
							<div className="grid gap-2">
								<Label>Stock inicial</Label>
								<Input type="number" min="0" value={productForm.stockInicial} onChange={handleInputChange("stockInicial")} />
							</div>
							<div className="grid gap-2">
								<Label>Bodega</Label>
								{locations.length > 0 ? (
									<>
										<Select
											value={productForm.bodegaId}
											onValueChange={(value: string) => handleChange("bodegaId", value)}
											disabled={!canAddStock}
										>
											<SelectTrigger>
												<SelectValue placeholder="Selecciona una bodega" />
											</SelectTrigger>
											<SelectContent>
												{locations.map((location) => (
													<SelectItem key={location.id} value={location.id}>
														{location.nombre}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button variant="ghost" className="justify-start px-0 text-sm gap-2" onClick={onRequestNewLocation}>
											<Plus className="h-4 w-4" />
											Crear bodega
										</Button>
									</>
								) : (
									<div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground space-y-2">
										<p>Necesitas crear una bodega antes de registrar stock inicial.</p>
										<Button size="sm" onClick={onRequestNewLocation} className="gap-2">
											<Plus className="h-4 w-4" /> Crear bodega
										</Button>
									</div>
								)}
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
	locations: InventoryLocation[]
	stockForm: StockFormState
	onFormChange: (value: StockFormState) => void
	onSubmit: () => void
	onDelete: () => void
	saving: boolean
	onRequestNewLocation: () => void
}

function StockDialog({
	open,
	onOpenChange,
	product,
	locations,
	stockForm,
	onFormChange,
	onSubmit,
	onDelete,
	saving,
	onRequestNewLocation,
}: StockDialogProps) {
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
											bodegaId: item.bodega?.id ?? item.bodega_id ?? stockForm.bodegaId,
											cantidad: item.cantidad?.toString() ?? "0",
											cantidadMinima: item.cantidad_minima?.toString() ?? "0",
											estado: item.estado ?? "ok",
										})
									}
								>
									<div>
										<p className="font-medium">{item.bodega?.nombre ?? item.ubicacion}</p>
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
							<Label>Bodega</Label>
							{locations.length > 0 ? (
								<>
									<Select value={stockForm.bodegaId} onValueChange={(value: string) => handleChange("bodegaId", value)}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona una bodega" />
										</SelectTrigger>
										<SelectContent>
											{locations.map((location) => (
												<SelectItem key={location.id} value={location.id}>
													{location.nombre}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button variant="ghost" className="justify-start px-0 text-sm gap-2" onClick={onRequestNewLocation}>
										<Plus className="h-4 w-4" />
										Crear bodega
									</Button>
								</>
							) : (
								<div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground space-y-2">
									<p>No hay bodegas registradas. Crea una para asignar el stock.</p>
									<Button size="sm" onClick={onRequestNewLocation} className="gap-2">
										<Plus className="h-4 w-4" /> Crear bodega
									</Button>
								</div>
							)}
						</div>
						<div className="grid gap-2">
							<Label>Cantidad</Label>
							<Input type="number" min="0" value={stockForm.cantidad} onChange={handleInputChange("cantidad")} />
						</div>
						<div className="grid gap-2">
							<Label>Cantidad mínima</Label>
							<Input type="number" min="0" value={stockForm.cantidadMinima} onChange={handleInputChange("cantidadMinima")} />
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

type LocationDialogProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onCreated: (location: InventoryLocation) => void
}

type LocationFormState = {
	nombre: string
	descripcion: string
	direccion: string
	ciudad: string
}

function LocationDialog({ open, onOpenChange, onCreated }: LocationDialogProps) {
	const { toast } = useToast()
	const [form, setForm] = useState<LocationFormState>({
		nombre: "",
		descripcion: "",
		direccion: "",
		ciudad: "",
	})
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		if (!open) {
			setForm({
				nombre: "",
				descripcion: "",
				direccion: "",
				ciudad: "",
			})
			setSaving(false)
		}
	}, [open])

	const handleInputChange =
		(field: keyof LocationFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setForm((prev) => ({ ...prev, [field]: event.target.value }))
		}

	const handleSubmit = async () => {
		if (!form.nombre.trim()) {
			toast({ title: "El nombre es obligatorio", variant: "destructive" })
			return
		}

		setSaving(true)
		try {
			const location = await createInventoryLocation({
				nombre: form.nombre.trim(),
				descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
				direccion: form.direccion.trim() ? form.direccion.trim() : null,
				ciudad: form.ciudad.trim() ? form.ciudad.trim() : null,
			})
			if (!location) {
				throw new Error("No pudimos crear la bodega")
			}
			toast({ title: "Bodega creada", description: "Ya puedes asignarla al inventario." })
			onCreated(location)
			onOpenChange(false)
		} catch (error) {
			const message = error instanceof Error ? error.message : "No pudimos crear la bodega"
			toast({ title: "Error", description: message, variant: "destructive" })
		} finally {
			setSaving(false)
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Nueva bodega</DialogTitle>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="nombre-bodega">Nombre</Label>
						<Input id="nombre-bodega" value={form.nombre} onChange={handleInputChange("nombre")} autoFocus />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="descripcion-bodega">Descripción</Label>
						<Textarea id="descripcion-bodega" value={form.descripcion} onChange={handleInputChange("descripcion")} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="direccion-bodega">Dirección</Label>
						<Input id="direccion-bodega" value={form.direccion} onChange={handleInputChange("direccion")} />
					</div>
					<div className="grid gap-2">
						<Label htmlFor="ciudad-bodega">Ciudad</Label>
						<Input id="ciudad-bodega" value={form.ciudad} onChange={handleInputChange("ciudad")} />
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button onClick={handleSubmit} disabled={saving}>
						{saving ? "Guardando..." : "Crear bodega"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

function sortLocations(locations: InventoryLocation[]) {
	return [...locations].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }))
}

function buildProductMetadata(
	form: ProductFormState,
	existing: InventoryProductMetadata | null
): InventoryProductMetadata | null {
	const metadata: InventoryProductMetadata = { ...(existing ?? {}) }
	const imageUrl = form.imageUrl.trim()

	if (imageUrl) {
		metadata.image_url = imageUrl
	} else {
		delete metadata.image_url
	}

	delete metadata.lensId

	return Object.keys(metadata).length > 0 ? metadata : null
}

function buildLensAssetPayload(form: ProductFormState, producto: InventoryProduct | null): LensAssetInput | null {
	const lensId = form.lensId.trim()
	if (lensId.length === 0) {
		return null
	}

	const existingAsset = getPrimaryLensAsset(producto)
	const metadataBase =
		existingAsset?.metadata && typeof existingAsset.metadata === "object"
			? { ...existingAsset.metadata }
			: {}
	const metadata = { ...metadataBase, lens_id: lensId }

	const payload: LensAssetInput = {
		lensId,
		provider: (existingAsset?.provider ?? "snap") || "snap",
		tipo: (existingAsset?.tipo ?? "lens") || "lens",
		metadata,
		activo: existingAsset?.activo ?? true,
	}

	if (existingAsset?.id) {
		payload.id = existingAsset.id
	}

	if (existingAsset?.url) {
		payload.url = existingAsset.url
	}

	if (existingAsset?.version) {
		payload.version = existingAsset.version
	}

	return payload
}

function getPrimaryLensAsset(producto?: InventoryProduct | null): LensAsset | null {
	if (!producto) return null
	const assets = Array.isArray(producto.lens_assets) ? producto.lens_assets : []
	if (!assets.length) return null

	const activeAssets = assets.filter((asset) => asset && asset.activo !== false)
	if (!activeAssets.length) return null

	const findBy = (predicate: (asset: LensAsset) => boolean) =>
		activeAssets.find((asset) => {
			try {
				return predicate(asset)
			} catch {
				return false
			}
		})

	const snapLens = findBy((asset) =>
		(asset.provider ?? "").toLowerCase() === "snap" && (asset.tipo ?? "").toLowerCase() === "lens"
	)
	if (snapLens) {
		return snapLens
	}

	const genericLens = findBy((asset) => (asset.tipo ?? "").toLowerCase() === "lens")
	if (genericLens) {
		return genericLens
	}

	return activeAssets[0] ?? null
}

function getProductLensId(producto?: InventoryProduct | null): string {
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
		// noop - not a valid URL
	}

	return ""
}

