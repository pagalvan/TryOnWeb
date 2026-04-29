import type { ReactNode } from "react"

import type { DashboardContext, DashboardSectionId } from "@/app/dashboard/_data"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button"
import { DashboardSectionNav } from "@/components/dashboard/dashboard-section-nav"

type DashboardShellProps = {
  context: DashboardContext
  activeSection: DashboardSectionId
  children: ReactNode
}

export function DashboardShell({ context, activeSection, children }: DashboardShellProps) {
  const {
    overview,
    exportData,
    sectionNavItems,
    activeCategory,
    activeLocation,
    statusLabel,
    periodLabel,
    updatedLabel,
  } = context

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      <main id="dashboard-export-area" className="container mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Panel ejecutivo</p>
              </div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Operaciones de inventario</h1>
              <p className="text-lg text-muted-foreground">
                Observa la salud del inventario, el desempeño del probador virtual y las alertas clave en un solo lugar.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 text-xs text-muted-foreground md:items-end">
              <span className="rounded-full bg-card border border-border px-4 py-1.5 shadow-sm">Actualizado {updatedLabel}</span>
              <DashboardExportButton exportData={exportData} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-card border border-border px-4 py-1.5 shadow-sm">Periodo: {periodLabel}</span>
            {activeCategory ? (
              <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-4 py-1.5 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 shadow-sm">Categoría: {activeCategory}</span>
            ) : null}
            {activeLocation ? (
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-4 py-1.5 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 shadow-sm">Ubicación: {activeLocation}</span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 px-4 py-1.5 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900 shadow-sm">{statusLabel}</span>
            ) : null}
          </div>
        </header>

        <DashboardFilters filters={overview.context.filters} availableFilters={overview.context.availableFilters} />

        <DashboardSectionNav items={sectionNavItems} activeSection={activeSection} />

        {children}
      </main>
    </div>
  )
}
