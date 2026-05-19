"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { DashboardExportSheet, type DashboardExportData } from "./dashboard-export-sheet"

type DashboardExportButtonProps = {
  targetSelector?: string
  exportData?: DashboardExportData
  fileName?: string
}

export function DashboardExportButton({ targetSelector, exportData, fileName = "dashboard-tryonweb" }: DashboardExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isSheetVisible, setSheetVisible] = useState(false)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const hasCustomSheet = Boolean(exportData)

  const exportContent = useMemo(() => {
    if (!exportData) return null
    return <DashboardExportSheet data={exportData} />
  }, [exportData])

  const handleExport = useCallback(async () => {
    if (isExporting) return
    setIsExporting(true)

    try {
      if (hasCustomSheet) {
        setSheetVisible(true)
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null))))
        if ("fonts" in document) {
          try {
            await document.fonts.ready
          } catch (error) {
            console.warn("No pudimos confirmar las fuentes antes de exportar", error)
          }
        }
      }

      const element = hasCustomSheet ? sheetRef.current : targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null
      if (!element) {
        throw new Error("No encontramos el panel para exportar")
      }

      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))

      element.setAttribute("data-exporting", "true")

      const { toPng } = await import("html-to-image")
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.35)
      const capturePromise = toPng(element, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: getComputedStyle(document.body).backgroundColor || "#f5f7ff",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
        filter: (node) => !(node instanceof HTMLElement && node.dataset.noExport === "true"),
      })

      const timeoutMs = 12000
      const dataUrl = await Promise.race([
        capturePromise,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), timeoutMs)),
      ])

      const link = document.createElement("a")
      link.href = dataUrl
      const timestamp = new Date().toISOString().split("T")[0]
      link.download = `${fileName}-${timestamp}.png`
      link.click()

      toast({
        title: "Dashboard exportado",
        description: "Guardamos una imagen con las métricas actuales.",
      })
    } catch (error) {
      console.error("Dashboard export failed", error)
      toast({
        title: "No pudimos exportar",
        description:
          error instanceof Error && error.message === "timeout"
            ? "El proceso tardó demasiado. Intenta con menos secciones visibles."
            : "Intenta nuevamente o verifica si el panel está visible.",
        variant: "destructive",
      })
    } finally {
      const element = hasCustomSheet ? sheetRef.current : targetSelector ? document.querySelector<HTMLElement>(targetSelector) : null
      element?.removeAttribute("data-exporting")
      if (hasCustomSheet) {
        setSheetVisible(false)
      }
      setIsExporting(false)
    }
  }, [fileName, hasCustomSheet, isExporting, targetSelector, toast])

  return (
    <>
      <Button size="sm" className="gap-2 rounded-full" onClick={handleExport} disabled={isExporting}>
        {isExporting ? (
          <Spinner className="h-4 w-4" />
        ) : (
          <BarChart3 className="h-4 w-4" />
        )}
        {isExporting ? "Exportando..." : "Exportar dashboard"}
      </Button>
      {exportContent ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center bg-transparent">
          <div
            className={`rounded-[24px] bg-white dark:bg-slate-900 shadow-[0_30px_80px_rgba(15,23,42,0.18)] transition-opacity duration-75 ${isSheetVisible ? "opacity-100" : "opacity-0"}`}
          >
            <div aria-hidden ref={sheetRef} className="select-none">
              {exportContent}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
