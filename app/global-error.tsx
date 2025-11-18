"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center text-foreground">
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Fallo inesperado</p>
          <h1 className="text-3xl font-semibold">El sistema encontró un error</h1>
          <p className="text-base text-muted-foreground">
            Intentaremos recuperar la sesión automáticamente. Si el error continúa, vuelve a intentar más tarde o
            contacta al administrador.
          </p>
          {error?.digest ? (
            <p className="text-xs text-muted-foreground">Código de diagnóstico: {error.digest}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm"
        >
          Reintentar
        </button>
      </body>
    </html>
  )
}
