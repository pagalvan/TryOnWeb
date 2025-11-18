"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Algo salió mal</p>
        <h1 className="text-2xl font-semibold tracking-tight">No pudimos cargar esta vista</h1>
        <p className="text-muted-foreground">
          Intenta refrescar la página. Si el problema persiste, vuelve al panel principal mientras lo
          revisamos.
        </p>
        {error?.digest ? (
          <p className="text-xs text-muted-foreground">Código de diagnóstico: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="rounded-md border border-input px-6 py-2 text-sm font-medium text-muted-foreground"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  )
}
