"use client"

import { forwardRef } from "react"
import { Camera, FlipHorizontal, Loader2, RefreshCcw, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CameraKitPlayer, type CameraKitPlayerHandle } from "@/components/camera-kit/CameraKitPlayer"
import { cn } from "@/lib/utils"
import { getLensId, type LensProduct } from "./types"

interface CameraViewProps {
  selectedProduct: LensProduct | null
  sessionActive: boolean
  cameraFacing: "user" | "environment"
  cameraToken: string
  lensGroupId: string
  lastError: string | null
  sessionMutating: boolean
  analyzing: boolean
  onToggleFacing: () => void
  onStopSession: () => void
  onAnalyze: () => void
  onPlayerReady: () => void
  onPlayerError: (error: Error) => void
}

export const CameraView = forwardRef<CameraKitPlayerHandle, CameraViewProps>(
  (
    {
      selectedProduct,
      sessionActive,
      cameraFacing,
      cameraToken,
      lensGroupId,
      lastError,
      sessionMutating,
      analyzing,
      onToggleFacing,
      onStopSession,
      onAnalyze,
      onPlayerReady,
      onPlayerError,
    },
    ref
  ) => {
    const activeLensId = selectedProduct ? getLensId(selectedProduct) : ""
    const facingLabel = cameraFacing === "user" ? "Frontal" : "Posterior"
    const canRenderPlayer = sessionActive && Boolean(cameraToken) && activeLensId.length > 0

    return (
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
              <Badge
                className={cn(
                  "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
                  sessionActive ? "" : "opacity-60"
                )}
              >
                {sessionActive ? "Cámara activa" : "Cámara inactiva"}
              </Badge>
              <Badge className="border-primary/30 bg-primary/10 text-primary">{facingLabel}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {canRenderPlayer && selectedProduct ? (
            <CameraKitPlayer
              ref={ref}
              key={`${selectedProduct.id}-${cameraFacing}`}
              apiToken={cameraToken}
              lensId={activeLensId}
              lensGroupId={lensGroupId}
              cameraFacing={cameraFacing}
              onReady={onPlayerReady}
              onError={onPlayerError}
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
              onClick={onToggleFacing}
              disabled={!sessionActive || sessionMutating || analyzing}
            >
              <FlipHorizontal className="h-4 w-4" />
              Cambiar cámara
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onStopSession}
              disabled={!sessionActive || sessionMutating || analyzing}
            >
              <RefreshCcw className="h-4 w-4" />
              Reiniciar
            </Button>
            <Button
              variant="default"
              size="sm"
              className="gap-2 ml-auto bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onAnalyze}
              disabled={!sessionActive || sessionMutating || analyzing}
            >
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
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
              Permite el acceso a la cámara cuando el navegador lo solicite. Tus datos permanecen en tu
              dispositivo.
            </p>
          )}
        </CardContent>
      </Card>
    )
  }
)

CameraView.displayName = "CameraView"
