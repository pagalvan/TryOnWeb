'use client'

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, type CSSProperties } from "react"

type CameraFacing = "user" | "environment"

type LensStatus = "idle" | "loading" | "ready" | "error"

type CameraKitModule = {
  bootstrapCameraKit: (config: { apiToken: string }) => Promise<CameraKitInstance>
  createUserMediaSource?: (config: { cameraType: "front" | "back" }) => Promise<CameraKitSource>
  createMediaStreamSource?: (stream: MediaStream) => Promise<CameraKitSource>
}

type CameraKitInstance = {
  createSession: (config: { liveRenderTarget: HTMLCanvasElement }) => Promise<CameraKitSession>
  lensRepository: {
    loadLensGroups?: (groupIds: string[]) => Promise<unknown>
    loadLens?: (options: { lensId: string; groupId?: string }) => Promise<unknown>
    findLensById?: (lensId: string) => Promise<unknown>
  }
}

type CameraKitSession = {
  setSource: (source: CameraKitSource) => Promise<void>
  play?: () => Promise<void>
  pause?: () => Promise<void>
  stop?: () => Promise<void>
  dispose?: () => void
  destroy?: () => void
  setLens?: (lens: unknown) => Promise<void>
  applyLens?: (lens: unknown) => Promise<void>
}

type CameraKitSource = {
  play?: () => Promise<void>
  pause?: () => Promise<void>
  stop?: () => Promise<void>
  dispose?: () => void
  close?: () => void
}

export interface CameraKitPlayerProps {
  apiToken: string
  lensId?: string | null
  lensGroupId?: string
  cameraFacing?: CameraFacing
  className?: string
  style?: CSSProperties
  onReady?: () => void
  onError?: (error: Error) => void
}

export interface CameraKitPlayerHandle {
  captureSnapshot: () => Promise<Blob | null>
}

const facingToCameraKit = (facing: CameraFacing) => (facing === "environment" ? "back" : "front")

export const CameraKitPlayer = forwardRef<CameraKitPlayerHandle, CameraKitPlayerProps>(({
  apiToken,
  lensId,
  lensGroupId,
  cameraFacing = "user",
  className,
  style,
  onReady,
  onError,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sessionRef = useRef<CameraKitSession | null>(null)
  const sourceRef = useRef<CameraKitSource | null>(null)
  const cameraKitRef = useRef<CameraKitInstance | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const [bootstrapping, setBootstrapping] = useState(true)
  const [sessionReady, setSessionReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lensStatus, setLensStatus] = useState<LensStatus>("idle")
  const [lensError, setLensError] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)

  // Use refs for callbacks to avoid re-triggering effects
  const onReadyRef = useRef(onReady)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onReadyRef.current = onReady
    onErrorRef.current = onError
  }, [onReady, onError])

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
       const msg = "La cámara requiere una conexión segura (HTTPS). Por favor, usa HTTPS."
       console.warn(msg)
       setCameraError(msg)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    captureSnapshot: async () => {
      if (!canvasRef.current) return null
      try {
        return new Promise<Blob | null>((resolve) => {
          canvasRef.current?.toBlob((blob) => {
            resolve(blob)
          }, 'image/jpeg', 0.95)
        })
      } catch (e) {
        console.error("Snapshot failed (likely offscreen canvas):", e)
        return null
      }
    }
  }))

  useEffect(() => {
    let isCancelled = false

    const initializeSession = async (retryCount = 0) => {
      if (!canvasRef.current) return

      setBootstrapping(true)
      setSessionReady(false)
      setCameraError(null)

      try {
        const cameraKitModule = (await import("@snap/camera-kit")) as CameraKitModule
        const bootstrapCameraKit = cameraKitModule.bootstrapCameraKit
        if (typeof bootstrapCameraKit !== "function") {
          throw new Error("No encontramos la inicialización de Camera Kit")
        }

        const cameraKit = await bootstrapCameraKit({ apiToken })
        if (isCancelled) return

        const session = await cameraKit.createSession({ liveRenderTarget: canvasRef.current })
        if (isCancelled) {
          session.dispose?.()
          return
        }

        let source: CameraKitSource | null = null
        let mediaStream: MediaStream | null = null

        if (typeof cameraKitModule.createUserMediaSource === "function") {
          source = await cameraKitModule.createUserMediaSource({ cameraType: facingToCameraKit(cameraFacing) })
        } else {
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             throw new Error("Tu navegador no permite acceso a la cámara en este contexto (posiblemente falta HTTPS).")
          }
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraFacing === "environment" ? { ideal: "environment" } : "user" },
            audio: false,
          })

          if (typeof cameraKitModule.createMediaStreamSource !== "function") {
            throw new Error("No se pudo crear la fuente de video para Camera Kit")
          }

          source = await cameraKitModule.createMediaStreamSource(mediaStream)
        }

        if (isCancelled) {
          mediaStream?.getTracks().forEach((track) => track.stop())
          source?.dispose?.()
          session.dispose?.()
          return
        }

        await session.setSource(source)
        if (typeof source.play === "function") {
          await source.play()
        }
        if (typeof session.play === "function") {
          await session.play()
        }

        cameraKitRef.current = cameraKit
        sessionRef.current = session
        sourceRef.current = source
        mediaStreamRef.current = mediaStream

        setBootstrapping(false)
        setSessionReady(true)
        onReadyRef.current?.()
      } catch (error) {
        if (isCancelled) return

        console.error("Camera Kit initialization error:", error)

        if (error instanceof Error && error.message.includes("transferControlToOffscreen")) {
            console.log("Canvas transfer error detected, forcing reset...")
            setResetKey(prev => prev + 1)
            return
        }

        // Retry logic for network/cache errors
        if (retryCount < 3) {
          console.log(`Retrying Camera Kit initialization (Attempt ${retryCount + 1})...`)
          setTimeout(() => initializeSession(retryCount + 1), 1500)
          return
        }

        let message =
          error instanceof Error
            ? error.message
            : "No se pudo activar la cámara. Verifica los permisos del navegador."
        
        if (message.includes("Network request") || message.includes("cache lookup")) {
            message = "Error de red al cargar componentes de cámara. Verifica tu conexión."
        } else if (message.includes("undefined is not an object")) {
            message = "Tu navegador no es compatible o requiere HTTPS."
        }

        setCameraError(message)
        setBootstrapping(false)
        onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    initializeSession()

    return () => {
      isCancelled = true
      setSessionReady(false)

      const session = sessionRef.current
      session?.pause?.()
      session?.stop?.()
      session?.dispose?.()
      session?.destroy?.()
      sessionRef.current = null

      const source = sourceRef.current
      source?.pause?.()
      source?.stop?.()
      source?.dispose?.()
      source?.close?.()
      sourceRef.current = null

      const stream = mediaStreamRef.current
      stream?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null

      cameraKitRef.current = null
    }
  }, [apiToken, cameraFacing, resetKey]) // Removed onReady/onError from deps

  useEffect(() => {
    const applyLens = async () => {
      if (!lensId || !sessionReady || !sessionRef.current || !cameraKitRef.current) {
        setLensStatus("idle")
        setLensError(null)
        return
      }

      setLensStatus("loading")
      setLensError(null)

      try {
        const lensRepository = cameraKitRef.current.lensRepository
        let lens: unknown = null
        const loadErrors: Error[] = []

        const recordError = (error: unknown) => {
          const normalized = error instanceof Error ? error : new Error(String(error))
          loadErrors.push(normalized)
          console.error("[CameraKit] loadLens error", normalized)
        }

        const loadLensFn = lensRepository.loadLens
        if (typeof loadLensFn === "function") {
          const callLoadLens = async (useGroup: boolean) => {
            if (useGroup && !lensGroupId) {
              return false
            }
            try {
              const args = useGroup ? [lensId, lensGroupId] : [lensId]
              const result = await (loadLensFn as (...args: unknown[]) => Promise<unknown>).apply(
                lensRepository,
                args
              )
              if (result) {
                lens = result
                return true
              }
            } catch (error) {
              recordError(error)
            }
            return false
          }

          if (lensGroupId) {
            await callLoadLens(true)
          }
          if (!lens) {
            await callLoadLens(false)
          }
        }

        if (!lens && typeof lensRepository.findLensById === "function") {
          try {
            lens = await lensRepository.findLensById(lensId)
          } catch (error) {
            recordError(error)
          }
        }

        if (!lens && lensGroupId && typeof lensRepository.loadLensGroups === "function") {
          try {
            const result = await lensRepository.loadLensGroups([lensGroupId])
            const lenses = Array.isArray((result as any)?.lenses) ? (result as any).lenses : []
            lens =
              lenses.find((candidate: any) => {
                const candidateId = candidate?.id ?? candidate?.lensId ?? candidate?.metadata?.lensId
                return typeof candidateId === "string" && candidateId.trim() === lensId
              }) ?? null
          } catch (error) {
            recordError(error)
          }
        }

        if (!lens) {
          const friendlyMessage = lensGroupId
            ? `No pudimos cargar el Lens ${lensId}. Verifica que pertenezca al Lens Group configurado.`
            : `No pudimos cargar el Lens ${lensId}. Revisa que el ID exista en Camera Kit.`
          if (loadErrors.length === 0) {
            throw new Error(friendlyMessage)
          }
          throw new Error(`${friendlyMessage} Detalle: ${loadErrors[loadErrors.length - 1].message}`)
        }

        const session = sessionRef.current
        if (session?.setLens) {
          await session.setLens(lens)
        } else if (session?.applyLens) {
          await session.applyLens(lens)
        } else {
          throw new Error("La sesión actual no permite aplicar lentes")
        }

        setLensStatus("ready")
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No se pudo cargar el lente de realidad aumentada"
        setLensStatus("error")
        setLensError(message)
        onErrorRef.current?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    applyLens()
  }, [lensGroupId, lensId, sessionReady]) // Removed onError from deps

  const shouldShowOverlay = bootstrapping || Boolean(cameraError) || lensStatus === "loading" || Boolean(lensError)

  return (
    <div className={className} style={style}>
      <div className="relative w-full h-full min-h-[240px] overflow-hidden rounded-xl bg-black">
        <canvas ref={canvasRef} key={`${cameraFacing}-${resetKey}`} className="h-full w-full" aria-hidden={false} />
        {shouldShowOverlay ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 px-6 text-center text-sm text-white">
            {cameraError && <p>{cameraError}</p>}
            {!cameraError && bootstrapping && <p>Activando cámara…</p>}
            {!cameraError && !bootstrapping && lensStatus === "loading" && <p>Cargando lente…</p>}
            {!cameraError && lensError && <p>{lensError}</p>}
          </div>
        ) : null}
      </div>
    </div>
  )
})
