"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Edit, Eye, Heart, Loader2, Share2, Wand2, Palette, Ruler } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { apiFetch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { CameraKitPlayer, type CameraKitPlayerHandle } from "@/components/camera-kit/CameraKitPlayer"
import { getCameraKitToken, CAMERA_KIT_DEFAULT_LENS_GROUP_ID } from "@/lib/camera-kit"
import { supabase } from "@/lib/supabase/client"

type InventarioItem = {
  id: string
  ubicacion: string
  cantidad: number
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
  lens_assets?: LensAsset[] | null
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
  const mediaRef = useRef<HTMLDivElement | null>(null)
  const [arActive, setArActive] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user")
  const { toast } = useToast()

  // AI Recommendations State
  const [analyzing, setAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<any | null>(null)
  const [recommendationOpen, setRecommendationOpen] = useState(false)
  const playerRef = useRef<CameraKitPlayerHandle>(null)

  const cameraToken = getCameraKitToken()
  const lensGroupId = CAMERA_KIT_DEFAULT_LENS_GROUP_ID

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
    setArActive(false)
    setCameraFacing("user")
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

  const lensId = useMemo(() => getProductLensId(producto), [producto])
  const hasLens = lensId.length > 0

  useEffect(() => {
    if (!hasLens && arActive) {
      setArActive(false)
    }
  }, [arActive, hasLens])

  const canActivateAr = hasLens && Boolean(cameraToken)
  const showCameraPlayer = arActive && Boolean(cameraToken) && lensId.length > 0

  const scrollToMedia = () => {
    if (typeof window === "undefined") return
    window.requestAnimationFrame(() => {
      mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  const handleStartAr = () => {
    if (!canActivateAr) return
    setArActive(true)
    scrollToMedia()
  }

  const handleStopAr = () => {
    setArActive(false)
  }

  const handlePlayerError = (error: Error) => {
    setArActive(false)
    toast({
      title: "No pudimos iniciar la cámara",
      description: error.message,
      variant: "destructive",
    })
  }

  const handleAnalyze = async () => {
    if (!playerRef.current) return
    setAnalyzing(true)
    
    try {
      // 1. Capture Snapshot
      const blob = await playerRef.current.captureSnapshot()
      if (!blob) throw new Error("No se pudo capturar la imagen de la cámara")

      // 2. Upload to Supabase
      const fileName = `snapshot-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('tryon-snapshots')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`)

      const { data: { publicUrl } } = supabase.storage
        .from('tryon-snapshots')
        .getPublicUrl(fileName)

      // 3. Call AI API
      const response = await fetch('/api/recommendations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: publicUrl }),
      })

      if (!response.ok) throw new Error("Error al analizar la imagen con IA")

      const result = await response.json()
      if (result.styleRecommendations || result.recommendations) {
        setRecommendations(result)
        setRecommendationOpen(true)
      } else {
        throw new Error("No se recibieron recomendaciones válidas")
      }

    } catch (error) {
      console.error(error)
      toast({
        title: "Error al analizar",
        description: error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setAnalyzing(false)
    }
  }

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
          <div ref={mediaRef}>
            <div className="aspect-square bg-accent rounded-2xl overflow-hidden mb-4 relative">
              {showCameraPlayer ? (
                <CameraKitPlayer
                  ref={playerRef}
                  key={`${producto.id}-hero-${cameraFacing}`}
                  apiToken={cameraToken}
                  lensId={lensId}
                  lensGroupId={lensGroupId}
                  cameraFacing={cameraFacing}
                  onError={handlePlayerError}
                  className="h-full w-full"
                />
              ) : (
                <Image
                  src={producto.metadata?.image_url || "/placeholder.svg"}
                  alt={producto.nombre}
                  fill
                  className="object-cover"
                />
              )}
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
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <p className="text-muted-foreground">{producto.categorias?.nombre ?? "Sin categoría"}</p>
                {hasLens ? (
                  <Badge className="flex items-center gap-1 border-emerald-500/30 bg-emerald-500/15 text-emerald-500">
                    <Eye className="h-3 w-3" /> AR disponible
                  </Badge>
                ) : null}
              </div>
              <h1 className="font-display text-4xl font-bold text-foreground mb-4">{producto.nombre}</h1>
              <p className="text-3xl font-bold text-foreground mb-6">{formatCurrency(producto.valor_unitario)}</p>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {producto.descripcion ?? "Aún no hay descripción para este producto."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              {hasLens ? (
                <Button
                  type="button"
                  className={cn("flex-1 min-w-[200px]", userRole === "admin" ? "" : "w-full")}
                  onClick={arActive ? handleStopAr : handleStartAr}
                  disabled={!canActivateAr || analyzing}
                >
                  <Eye className="mr-2 h-5 w-5" />
                  {arActive ? "Cerrar AR" : "Probar con AR"}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1 min-w-[200px] bg-muted text-muted-foreground"
                  disabled
                >
                  <Eye className="mr-2 h-5 w-5" />
                  AR no disponible
                </Button>
              )}

              {arActive && (
                <Button
                  type="button"
                  className="flex-1 min-w-[200px] bg-cyan-600 hover:bg-cyan-700 text-white"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-5 w-5" />
                  )}
                  {analyzing ? "Analizando..." : "Analizar Look con IA"}
                </Button>
              )}

              <Button
                type="button"
                variant={isFavorited ? "secondary" : "outline"}
                className="flex-1 min-w-[160px]"
                disabled={favoriteLoading || analyzing}
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
            {!hasLens ? (
              <p className="-mt-4 mb-6 text-sm text-muted-foreground">
                Añade un Lens ID desde el inventario para habilitar la prueba en realidad aumentada.
              </p>
            ) : null}

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
                  <Detalle label="Experiencia AR" value={hasLens ? "Disponible" : "No disponible"} />
                  <Detalle label="Categoría" value={producto.categorias?.nombre ?? "Sin categoría"} />
                  <Detalle label="SKU" value={producto.sku ?? "Sin SKU"} />
                  <Detalle label="Ubicaciones" value={producto.inventario_items.map((i) => i.ubicacion).join(", ") || "Sin registros"} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

      </main>

      <Dialog open={recommendationOpen} onOpenChange={setRecommendationOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-cyan-600" />
              Recomendaciones de Estilo
            </DialogTitle>
            <DialogDescription>
              Basado en tu look actual, nuestra IA sugiere:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Colorimetry Section */}
            {recommendations?.colorimetry && (
              <div className="rounded-lg border p-4 bg-cyan-50/50 dark:bg-cyan-900/10">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-cyan-600" /> 
                  Análisis de Colorimetría
                </h4>
                <div className="mb-2">
                  <span className="font-medium text-sm">{recommendations.colorimetry.season}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{recommendations.colorimetry.description}</p>
                <div className="flex flex-wrap gap-2">
                  {recommendations.colorimetry.bestColors?.map((color: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-background/80">{color}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Size Section */}
            {recommendations?.sizeRecommendation && (
              <div className="rounded-lg border p-4 bg-blue-50/50 dark:bg-blue-900/10">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-blue-600" />
                  Recomendación de Talla
                </h4>
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-medium text-sm">{recommendations.sizeRecommendation.fit}</span>
                  {recommendations.sizeRecommendation.sizeRange && (
                    <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700">
                      {recommendations.sizeRecommendation.sizeRange}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{recommendations.sizeRecommendation.advice}</p>
              </div>
            )}

            {/* Style Recommendations */}
            <h4 className="font-semibold text-sm mt-4 mb-2 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-foreground" />
              Completar el Look
            </h4>
            {(recommendations?.styleRecommendations || (Array.isArray(recommendations) ? recommendations : []))?.map((rec: any, index: number) => (
              <div key={index} className="rounded-lg border p-4 bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{rec.name}</h4>
                  <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-cyan-500 rounded-full" 
                      style={{ width: `${rec.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{rec.confidence}% Match</span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
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

function getProductLensId(producto?: ProductoDetalle | null): string {
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

function getPrimaryLensAsset(producto?: ProductoDetalle | null): LensAsset | null {
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
