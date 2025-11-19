"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit, Eye, Heart, Loader2, Share2 } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type InventarioItem = {
  id: string
  ubicacion: string
  cantidad: number
}

type ProductoDetalle = {
  id: string
  nombre: string
  descripcion: string | null
  categoria_id: string | null
  categorias?: { id: string; nombre: string } | null
  valor_unitario: number | null
  metadata: Record<string, any> | null
  sku: string | null
  estado: string
  inventario_items: InventarioItem[]
}

export default function ProductoDetallePage() {
  const params = useParams<{ id: string }>()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [producto, setProducto] = useState<ProductoDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const viewLoggedRef = useRef(false)
  const { toast } = useToast()

  const productoId = params?.id

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"))
    }
  }, [])

  const registerEvent = useCallback(
    async (eventType: "view" | "share", metadata?: Record<string, unknown>) => {
      if (!productoId) return

      await apiFetch(`/api/product-events`, {
        method: "POST",
        body: JSON.stringify({
          productId: productoId,
          eventType,
          metadata,
        }),
      })
    },
    [productoId],
  )

  const refreshFavorite = useCallback(async () => {
    if (!productoId) {
      setIsFavorited(false)
      return
    }

    try {
      const response = await apiFetch<{ favorited: boolean }>(`/api/products/${productoId}/favorite`)
      setIsFavorited(Boolean(response?.favorited))
    } catch (error) {
      if (error instanceof Error && /(No autorizado|Permisos insuficientes)/i.test(error.message)) {
        setIsFavorited(false)
      }
    }
  }, [productoId])

  useEffect(() => {
    if (!productoId) return
    const fetchProducto = async () => {
      setLoading(true)
      try {
        const response = await apiFetch<{ data: ProductoDetalle }>(`/api/products/${productoId}`)
        if (!response.data) {
          setError("Producto no encontrado")
          setProducto(null)
        } else {
          setProducto(response.data)
          setError(null)
          await refreshFavorite()
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "No pudimos cargar el producto"
        setError(message)
        setProducto(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProducto()
  }, [productoId, refreshFavorite])

  useEffect(() => {
    if (typeof window !== "undefined" && productoId) {
      setShareUrl(`${window.location.origin}/productos/${productoId}`)
    }
  }, [productoId])

  useEffect(() => {
    viewLoggedRef.current = false
    setIsFavorited(false)
    setFavoriteLoading(false)
    setShareLoading(false)
  }, [productoId])

  useEffect(() => {
    if (!producto || !productoId || viewLoggedRef.current) {
      return
    }

    viewLoggedRef.current = true
    registerEvent("view").catch(() => {
      viewLoggedRef.current = false
    })
  }, [producto, productoId, registerEvent])

  const handleFavorite = useCallback(async () => {
    if (favoriteLoading) {
      return
    }

    try {
      setFavoriteLoading(true)
      if (!productoId) {
        throw new Error("Producto inválido")
      }

      if (isFavorited) {
        await apiFetch(`/api/products/${productoId}/favorite`, { method: "DELETE" })
        setIsFavorited(false)
        toast({ title: "Favorito eliminado", description: "Ya no seguirá en tu lista." })
      } else {
        await apiFetch(`/api/products/${productoId}/favorite`, { method: "POST" })
        setIsFavorited(true)
        toast({ title: "Producto guardado", description: "Lo tendrás presente en tus métricas." })
      }
    } catch (error) {
      if (error instanceof Error && /(No autorizado|Permisos insuficientes)/i.test(error.message)) {
        toast({ title: "Inicia sesión", description: "Necesitas iniciar sesión para administrar favoritos." })
        return
      }

      toast({
        title: "No pudimos guardar",
        description: error instanceof Error ? error.message : "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setFavoriteLoading(false)
    }
  }, [favoriteLoading, isFavorited, productoId, toast])

  const handleShare = useCallback(async () => {
    if (!productoId || shareLoading) {
      return
    }

    try {
      setShareLoading(true)
      const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "")
      const nav =
        typeof navigator !== "undefined"
          ? (navigator as Navigator & {
              share?: Navigator["share"]
              clipboard?: Navigator["clipboard"]
            })
          : undefined
      let shared = false
      let shareMethod: "web-share" | "clipboard" | null = null

      if (nav?.share && typeof nav.share === "function") {
        await nav.share({ title: producto?.nombre, text: producto?.descripcion ?? undefined, url })
        shared = true
        shareMethod = "web-share"
        toast({ title: "Gracias por compartir", description: "Más personas podrán descubrir esta prenda." })
      } else if (nav?.clipboard && typeof nav.clipboard.writeText === "function" && url) {
        await nav.clipboard.writeText(url)
        shared = true
        shareMethod = "clipboard"
        toast({ title: "Enlace copiado", description: "Ya puedes pegarlo donde prefieras." })
      }

      if (shared) {
        await registerEvent("share", { method: shareMethod ?? "unknown" })
      } else {
        toast({
          title: "No pudimos compartir",
          description: "Copia manualmente el enlace desde la barra del navegador.",
          variant: "destructive",
        })
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      toast({
        title: "No pudimos compartir",
        description: error instanceof Error ? error.message : "Intenta nuevamente más tarde.",
        variant: "destructive",
      })
    } finally {
      setShareLoading(false)
    }
  }, [producto?.descripcion, producto?.nombre, productoId, registerEvent, shareLoading, shareUrl, toast])

  const stockTotal = useMemo(() => {
    if (!producto?.inventario_items) return 0
    return producto.inventario_items.reduce((acc, item) => acc + (item.cantidad ?? 0), 0)
  }, [producto])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          Cargando producto...
        </main>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-3xl text-foreground mb-4">No pudimos cargar el producto</h2>
          <p className="text-muted-foreground mb-6">{error ?? "Revisa el enlace e intenta nuevamente."}</p>
          <Button asChild>
            <Link href="/productos">Regresar al catálogo</Link>
          </Button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/productos"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square bg-accent rounded-2xl overflow-hidden mb-4 relative">
              <Image src={producto.metadata?.image_url || "/placeholder.svg"} alt={producto.nombre} fill className="object-cover" />
            </div>
            {producto.metadata?.gallery?.length ? (
              <div className="grid grid-cols-4 gap-4">
                {producto.metadata.gallery.slice(0, 4).map((url: string, idx: number) => (
                  <div key={url + idx} className="aspect-square bg-accent rounded-lg overflow-hidden relative">
                    <Image src={url} alt={`Vista ${idx + 1}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">{producto.categorias?.nombre ?? "Sin categoría"}</p>
              <h1 className="font-display text-4xl font-bold text-foreground mb-4">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-foreground mb-6">{formatCurrency(producto.valor_unitario)}</p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {producto.descripcion ?? "Aún no hay descripción para este producto."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                href="/probador-virtual"
                className={cn("flex-1 min-w-[200px]", userRole === "admin" ? "" : "w-full")}
              >
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Eye className="mr-2 h-5 w-5" />
                  Probar con AR
                </Button>
              </Link>

              <Button
                type="button"
                variant={isFavorited ? "secondary" : "outline"}
                className="flex-1 min-w-[160px]"
                disabled={favoriteLoading}
                onClick={handleFavorite}
              >
                {favoriteLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Heart className="mr-2 h-5 w-5" fill={isFavorited ? "currentColor" : "none"} />
                )}
                {isFavorited ? "En favoritos" : "Guardar"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1 min-w-[160px]"
                disabled={shareLoading}
                onClick={handleShare}
              >
                {shareLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Share2 className="mr-2 h-5 w-5" />
                )}
                Compartir
              </Button>

              {userRole === "admin" && (
                <Button variant="outline" asChild className="flex-1 min-w-[160px]">
                  <Link href={`/inventario?edit=${producto.id}`}>
                    <Edit className="mr-2 h-5 w-5" />Editar
                  </Link>
                </Button>
              )}
            </div>

            {userRole === "admin" && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Stock Disponible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{stockTotal} unidades</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">SKU</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{producto.sku ?? "No registrado"}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Detalle label="Estado" value={producto.estado} />
                  <Detalle label="Categoría" value={producto.categorias?.nombre ?? "Sin categoría"} />
                  <Detalle label="SKU" value={producto.sku ?? "Sin SKU"} />
                  <Detalle label="Ubicaciones" value={producto.inventario_items.map((i) => i.ubicacion).join(", ") || "Sin registros"} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

function Detalle({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  )
}
