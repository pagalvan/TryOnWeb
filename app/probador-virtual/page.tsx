"use client"

import Image from "next/image"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  Sparkles,
  ShieldCheck,
  Loader2,
  RefreshCcw,
  FlipHorizontal,
  Wand2,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CameraKitPlayer, type CameraKitPlayerHandle } from "@/components/camera-kit/CameraKitPlayer"
import { apiFetch } from "@/lib/api-client"
import { getCameraKitToken, CAMERA_KIT_DEFAULT_LENS_GROUP_ID } from "@/lib/camera-kit"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase/client"

type LensMetadata = {
  lensId?: string
  image_url?: string
  [key: string]: unknown
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

type LensProduct = {
  id: string
  nombre: string
  descripcion: string | null
  valor_unitario: number | null
  estado: string
  metadata: LensMetadata | null
  categorias?: {
    id: string
    nombre: string
  } | null
  lens_assets?: LensAsset[] | null
}

type TryOnItemStatus = "exito" | "parcial" | "descartado" | "pendiente"

export default function ProbadorVirtualPage() {
  const [products, setProducts] = useState<LensProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user")
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [pendingStartProductId, setPendingStartProductId] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [sessionMutating, setSessionMutating] = useState(false)
  
  // AI Recommendations State
  const [analyzing, setAnalyzing] = useState(false)
  const [recommendations, setRecommendations] = useState<any[] | null>(null)
  const [recommendationOpen, setRecommendationOpen] = useState(false)
  const playerRef = useRef<CameraKitPlayerHandle>(null)

  const cameraToken = getCameraKitToken()
  const lensGroupId = CAMERA_KIT_DEFAULT_LENS_GROUP_ID

  const activeProductIdRef = useRef<string | null>(null)
  const activeItemStartRef = useRef<number | null>(null)
  const skipProductEffectRef = useRef(false)
  const sessionBusyCountRef = useRef(0)

  const beginSessionOperation = useCallback(() => {
    sessionBusyCountRef.current += 1
    if (sessionBusyCountRef.current === 1) {
      setSessionMutating(true)
    }
  }, [])

  const endSessionOperation = useCallback(() => {
    sessionBusyCountRef.current = Math.max(0, sessionBusyCountRef.current - 1)
    if (sessionBusyCountRef.current === 0) {
      setSessionMutating(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiFetch<{ data: LensProduct[] }>("/api/products")
      const rawProducts = response.data ?? []
      const lensProducts = rawProducts.filter((product) => getLensId(product).length > 0)

      setProducts(lensProducts)
      setSelectedProductId((current) =>
        current && lensProducts.some((product) => product.id === current)
          ? current
          : lensProducts[0]?.id ?? null,
      )

      if (lensProducts.length === 0) {
        setSessionActive(false)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "No pudimos cargar los productos con AR")
      setProducts([])
      setSessionActive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  )

  const pendingProduct = useMemo(
    () => products.find((product) => product.id === (pendingStartProductId ?? selectedProductId)) ?? null,
    [pendingStartProductId, products, selectedProductId],
  )

  const activeLensId = selectedProduct ? getLensId(selectedProduct) : ""
  const facingLabel = cameraFacing === "user" ? "Frontal" : "Posterior"
  const canRenderPlayer = sessionActive && Boolean(cameraToken) && activeLensId.length > 0
  const pendingLensId = getLensId(pendingProduct ?? selectedProduct ?? undefined)
  const sessionReady = Boolean(sessionId)

  const resetSessionState = useCallback(() => {
    setSessionId(null)
    setActiveItemId(null)
    activeProductIdRef.current = null
    activeItemStartRef.current = null
    skipProductEffectRef.current = false
  }, [])

  const getDeviceInfo = useCallback(() => {
    if (typeof navigator === "undefined") {
      return { device: undefined, platform: "web" }
    }

    const agent = navigator.userAgent ?? ""
    const platform =
      (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.platform ??
      "web"

    return {
      device: agent ? agent.slice(0, 160) : undefined,
      platform: platform ? platform.slice(0, 80) : undefined,
    }
  }, [])

  const finalizeItem = useCallback(
    async ({
      itemId,
      startedAt,
      status = "exito",
      endedAt,
    }: {
      itemId: string
      startedAt: number
      status?: TryOnItemStatus
      endedAt?: number
    }) => {
      if (!sessionId) return

      const finish = endedAt ?? Date.now()
      const durationSeconds = Math.max(1, Math.round((finish - startedAt) / 1000))

      await apiFetch(`/api/tryon-sessions/${sessionId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          durationSeconds,
        }),
      })
    },
    [sessionId],
  )

  const startTryOnExperience = useCallback(
    async (product: LensProduct) => {
      if (sessionId) {
        return sessionId
      }

      setSessionMutating(true)

      try {
        const asset = getPrimaryLensAsset(product)
        const deviceInfo = getDeviceInfo()

        const response = await apiFetch<{ sessionId: string; itemId?: string }>(`/api/tryon-sessions`, {
          method: "POST",
          body: JSON.stringify({
            productId: product.id,
            lensAssetId: asset?.id ?? null,
            device: deviceInfo.device,
            platform: deviceInfo.platform,
            origin: "probador-virtual",
          }),
        })

        setSessionId(response.sessionId)
        setActiveItemId(response.itemId ?? null)
        activeItemStartRef.current = Date.now()
        activeProductIdRef.current = product.id
        skipProductEffectRef.current = true

        return response.sessionId
      } catch (error) {
        resetSessionState()
        throw error instanceof Error ? error : new Error("No pudimos iniciar la sesión de try-on")
      } finally {
        endSessionOperation()
      }
    },
    [endSessionOperation, getDeviceInfo, resetSessionState, sessionId],
  )

  const switchTryOnItem = useCallback(
    async (product: LensProduct) => {
      if (!sessionId) {
        throw new Error("No hay una sesión activa")
      }

      const now = Date.now()
      const asset = getPrimaryLensAsset(product)
      const currentItemId = activeItemId
      const currentStartedAt = activeItemStartRef.current

      if (currentItemId && currentStartedAt) {
        await finalizeItem({ itemId: currentItemId, startedAt: currentStartedAt, endedAt: now, status: "exito" })
      }

      const response = await apiFetch<{ itemId: string }>(`/api/tryon-sessions/${sessionId}/items`, {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          lensAssetId: asset?.id ?? null,
        }),
      })

      setActiveItemId(response.itemId ?? null)
      activeItemStartRef.current = now
      activeProductIdRef.current = product.id
    },
    [activeItemId, finalizeItem, sessionId],
  )

  const stopTryOnSession = useCallback(
    async (options?: { status?: TryOnItemStatus }) => {
      if (!sessionId) {
        resetSessionState()
        return
      }

      beginSessionOperation()

      const currentItemId = activeItemId
      const currentStartedAt = activeItemStartRef.current
      const now = Date.now()
      const targetStatus = options?.status ?? "exito"
      let pendingError: Error | null = null

      if (currentItemId && currentStartedAt) {
        try {
          await finalizeItem({
            itemId: currentItemId,
            startedAt: currentStartedAt,
            endedAt: now,
            status: targetStatus,
          })
        } catch (error) {
          pendingError = error instanceof Error ? error : new Error("No pudimos guardar el último producto probado")
        }
      }

      try {
        await apiFetch(`/api/tryon-sessions/${sessionId}`, {
          method: "PATCH",
          body: JSON.stringify({
            endedAt: new Date(now).toISOString(),
          }),
        })
      } catch (error) {
        pendingError = error instanceof Error ? error : new Error("No pudimos cerrar la sesión de try-on")
      } finally {
        resetSessionState()
        endSessionOperation()
      }

      if (pendingError) {
        throw pendingError
      }
    },
    [activeItemId, beginSessionOperation, endSessionOperation, finalizeItem, resetSessionState, sessionId],
  )

  const handleSelectProduct = (productId: string) => {
    if (sessionActive && sessionMutating) {
      return
    }

    setSelectedProductId(productId)
  }

  const handleStartProduct = (productId: string) => {
    if (sessionMutating) {
      return
    }

    setSelectedProductId(productId)

    if (sessionActive) {
      setLastError(null)
      return
    }

    setPendingStartProductId(productId)
    setPermissionDialogOpen(true)
  }

  const handleConfirmPermission = async () => {
    if (sessionMutating) {
      return
    }

    const productId = pendingStartProductId ?? selectedProductId
    if (!productId) {
      setPermissionDialogOpen(false)
      setPendingStartProductId(null)
      return
    }

    const product = products.find((item) => item.id === productId) ?? null
    if (!product) {
      setPermissionDialogOpen(false)
      setPendingStartProductId(null)
      setLastError("Producto no disponible para try-on")
      return
    }

    setSelectedProductId(product.id)
    setSessionActive(true)
    setLastError(null)
    setPermissionDialogOpen(false)
    setPendingStartProductId(null)

    try {
      await startTryOnExperience(product)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos iniciar la sesión de try-on"
      setLastError(message)
      setSessionActive(false)
    }
  }

  const handleCancelPermission = () => {
    setPermissionDialogOpen(false)
    setPendingStartProductId(null)
  }

  const handleStopSession = async () => {
    if (sessionMutating) {
      return
    }

    setSessionActive(false)
    setLastError(null)

    try {
      await stopTryOnSession({ status: "exito" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos cerrar la sesión"
      setLastError(message)
    }
  }

  const handleToggleFacing = () => {
    setCameraFacing((prev) => (prev === "user" ? "environment" : "user"))
  }

  const handlePlayerReady = useCallback(() => {
    setLastError(null)
  }, [])

  const handlePlayerError = useCallback(async (error: Error) => {
    setLastError(error.message)
    setSessionActive(false)

    try {
      await stopTryOnSession({ status: "descartado" })
    } catch (closeError) {
      console.error("close try-on session after player error", closeError)
    }
  }, [stopTryOnSession])

  const handleAnalyze = async () => {
    if (!playerRef.current) return
    setAnalyzing(true)
    setLastError(null)
    
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
      if (result.recommendations) {
        setRecommendations(result.recommendations)
        setRecommendationOpen(true)
      } else {
        throw new Error("No se recibieron recomendaciones válidas")
      }

    } catch (error) {
      console.error(error)
      setLastError(error instanceof Error ? error.message : "Error desconocido al analizar")
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    if (!sessionActive || !sessionReady) {
      return
    }

    const product = selectedProduct
    if (!product) {
      return
    }

    if (skipProductEffectRef.current) {
      skipProductEffectRef.current = false
      return
    }

    if (product.id === activeProductIdRef.current) {
      return
    }

    let cancelled = false
    beginSessionOperation()

    const run = async () => {
      try {
        await switchTryOnItem(product)
        if (!cancelled) {
          setLastError(null)
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "No pudimos registrar el cambio de prenda"
          setLastError(message)
        }
      } finally {
        endSessionOperation()
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [beginSessionOperation, endSessionOperation, sessionActive, sessionReady, selectedProduct, switchTryOnItem])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="mb-10">
          <div className="max-w-3xl space-y-4">
            <Badge className="flex w-fit items-center gap-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-600">
              <Sparkles className="h-3 w-3" /> Realidad aumentada en vivo
            </Badge>
            <h1 className="font-display text-4xl font-bold text-foreground md:text-5xl">
              Probador Virtual
            </h1>
            <p className="text-lg text-muted-foreground">
              Selecciona una prenda con Lens de Lens Studio y visualízala en tiempo real utilizando Snap Camera Kit.
            </p>
          </div>
        </header>

        {error ? (
          <Alert variant="destructive" className="mb-8">
            <AlertTitle>Ocurrió un problema</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            Cargando prendas con experiencia AR…
          </div>
        ) : products.length === 0 ? (
          <Card className="mb-12 border-dashed">
            <CardHeader>
              <CardTitle>No hay lentes asignados</CardTitle>
              <CardDescription>
                Agrega un Lens ID desde el módulo de inventario para habilitar experiencias de realidad aumentada en tus prendas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={fetchProducts} variant="outline" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mb-12 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Card className="h-full">
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-2xl">Probador en vivo</CardTitle>
                    <CardDescription>
                      {selectedProduct
                        ? `Lens listo: ${selectedProduct.nombre}`
                        : "Selecciona una prenda con Lens para comenzar."}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn(
                      "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                      sessionActive ? "" : "opacity-60",
                    )}>
                      {sessionActive ? "Cámara activa" : "Cámara inactiva"}
                    </Badge>
                    <Badge className="border-primary/30 bg-primary/10 text-primary">{facingLabel}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {canRenderPlayer && selectedProduct ? (
                  <CameraKitPlayer
                    ref={playerRef}
                    key={`${selectedProduct.id}-${cameraFacing}`}
                    apiToken={cameraToken}
                    lensId={activeLensId}
                    lensGroupId={lensGroupId}
                    cameraFacing={cameraFacing}
                    onReady={handlePlayerReady}
                    onError={handlePlayerError}
                  />
                ) : (
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-muted-foreground">
                      <Camera className="h-10 w-10" />
                      <p className="max-w-[18rem] text-sm">
                        Selecciona una prenda con Lens y pulsa “Probar” para iniciar la cámara.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleToggleFacing}
                    disabled={!sessionActive || sessionMutating || analyzing}
                  >
                    <FlipHorizontal className="h-4 w-4" />
                    Cambiar cámara
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleStopSession}
                    disabled={!sessionActive || sessionMutating || analyzing}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Reiniciar
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2 ml-auto bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleAnalyze}
                    disabled={!sessionActive || sessionMutating || analyzing}
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {analyzing ? "Analizando..." : "Analizar Look con IA"}
                  </Button>
                </div>

                {lastError ? (
                  <Alert variant="destructive">
                    <AlertTitle>No pudimos iniciar la cámara</AlertTitle>
                    <AlertDescription>{lastError}</AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Permite el acceso a la cámara cuando el navegador lo solicite. Tus datos permanecen en tu dispositivo.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>Prendas con Lens</CardTitle>
                    <CardDescription>Selecciona una prenda y comienza la experiencia AR</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="gap-2" onClick={fetchProducts}>
                    <RefreshCcw className="h-4 w-4" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {products.map((product) => {
                  const lensId = getLensId(product)
                  const isSelected = selectedProductId === product.id
                  const isActive = sessionActive && isSelected

                  return (
                    <div
                      key={product.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleSelectProduct(product.id)}
                      className={cn(
                        "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition",
                        isSelected
                          ? "border-primary/60 shadow-md"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault()
                          handleSelectProduct(product.id)
                        }
                      }}
                    >
                      <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={product.metadata?.image_url || "/placeholder.svg"}
                          alt={product.nombre}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">{product.nombre}</span>
                          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Lens</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {product.categorias?.nombre ?? "Sin categoría"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatCurrency(product.valor_unitario)}</span>
                          <span>•</span>
                          <span className="capitalize">{product.estado}</span>
                          <span>•</span>
                          <span className="font-mono text-xs">{lensId}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="ml-auto"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleStartProduct(product.id)
                        }}
                        disabled={isActive || sessionMutating}
                      >
                        {isActive ? "En uso" : sessionActive ? "Aplicar" : "Probar"}
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Modelos óptimos</CardTitle>
              <CardDescription>
                Lentes configurados en Lens Studio para lucir tu catálogo con iluminación y materiales realistas.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Privacidad garantizada</CardTitle>
              <CardDescription>
                El procesamiento ocurre en tu navegador con Snap Camera Kit; no almacenamos fotos ni video.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Cámara adaptable</CardTitle>
              <CardDescription>
                Cambia entre cámara frontal o posterior y alterna lentes en vivo sin reiniciar la sesión.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </main>

      <AlertDialog open={permissionDialogOpen} onOpenChange={setPermissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permite el acceso a tu cámara</AlertDialogTitle>
            <AlertDialogDescription>
              Seleccionamos {pendingProduct?.nombre ?? "la prenda"}. Autoriza la cámara del navegador para renderizar el
              Lens <span className="font-mono text-xs uppercase">{pendingLensId || "N/A"}</span> en tiempo real.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPermission}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPermission}>Permitir y continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={recommendationOpen} onOpenChange={setRecommendationOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-purple-600" />
              Recomendaciones de Estilo
            </DialogTitle>
            <DialogDescription>
              Basado en tu look actual, nuestra IA sugiere:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {recommendations?.map((rec, index) => (
              <div key={index} className="rounded-lg border p-4 bg-muted/30">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{rec.name}</h4>
                  <Badge variant="outline" className="text-xs">{rec.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full" 
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

function getLensId(product?: LensProduct | null) {
  const asset = getPrimaryLensAsset(product)
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

  const fallback = typeof product?.metadata?.lensId === "string" ? product.metadata.lensId.trim() : ""
  return fallback
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
}

function getPrimaryLensAsset(product?: LensProduct | null): LensAsset | null {
  if (!product) return null
  const assets = Array.isArray(product.lens_assets) ? product.lens_assets : []
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
