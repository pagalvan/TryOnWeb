'use client'

import { useEffect, useRef, useState, type CSSProperties } from "react"

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

const facingToCameraKit = (facing: CameraFacing) => (facing === "environment" ? "back" : "front")

export function CameraKitPlayer({
  apiToken,
  lensId,
  lensGroupId,
  cameraFacing = "user",
  className,
  style,
  onReady,
  onError,
}: CameraKitPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sessionRef = useRef<CameraKitSession | null>(null)
  const sourceRef = useRef<CameraKitSource | null>(null)
  const cameraKitRef = useRef<CameraKitInstance | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  const [bootstrapping, setBootstrapping] = useState(true)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [lensStatus, setLensStatus] = useState<LensStatus>("idle")
  const [lensError, setLensError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    const initializeSession = async () => {
      if (!canvasRef.current) return

      setBootstrapping(true)
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
        onReady?.()
      } catch (error) {
        if (isCancelled) return

        const message =
          error instanceof Error
            ? error.message
            : "No se pudo activar la cámara. Verifica los permisos del navegador."

        setCameraError(message)
        setBootstrapping(false)
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    initializeSession()

    return () => {
      isCancelled = true

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
  }, [apiToken, cameraFacing, onReady, onError])

  useEffect(() => {
    const applyLens = async () => {
      if (!lensId || !sessionRef.current || !cameraKitRef.current) {
        setLensStatus("idle")
        setLensError(null)
        return
      }

      setLensStatus("loading")
      setLensError(null)

      try {
        const lensRepository = cameraKitRef.current.lensRepository
        if (lensGroupId && typeof lensRepository.loadLensGroups === "function") {
          await lensRepository.loadLensGroups([lensGroupId])
        }

        let lens: unknown = null
        if (typeof lensRepository.loadLens === "function") {
          lens = await lensRepository.loadLens({ lensId, groupId: lensGroupId })
        } else if (typeof lensRepository.findLensById === "function") {
          lens = await lensRepository.findLensById(lensId)
        }

        if (!lens) {
          throw new Error("No encontramos el lente solicitado")
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
        onError?.(error instanceof Error ? error : new Error(String(error)))
      }
    }

    applyLens()
  }, [lensGroupId, lensId, onError])

  const shouldShowOverlay = bootstrapping || Boolean(cameraError) || lensStatus === "loading" || Boolean(lensError)

  return (
    <div className={className} style={style}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-black">
        <canvas ref={canvasRef} className="h-full w-full" aria-hidden={false} />
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
}
