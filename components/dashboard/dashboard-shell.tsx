import type { ReactNode } from "react"

import type { DashboardContext, DashboardSectionId } from "@/app/dashboard/_data"
import { DashboardFilters } from "@/components/dashboard/dashboard-filters"
import { DashboardExportButton } from "@/components/dashboard/dashboard-export-button"
import { DashboardSectionNav } from "@/components/dashboard/dashboard-section-nav"
import { Navbar } from "@/components/navbar"

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
    <div className="min-h-screen overflow-x-hidden bg-white">
      <Navbar />

      <main id="dashboard-export-area" className="container mx-auto max-w-[1180px] space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">Panel ejecutivo</p>
              <h1 className="text-[34px] font-semibold leading-tight text-slate-900 md:text-[38px]">Operaciones de inventario</h1>
              <p className="text-sm text-slate-500">
                Observa la salud del inventario, el desempeño del probador virtual y las alertas clave en un solo lugar.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 text-xs text-slate-500 md:items-end">
              <span className="rounded-full bg-white px-4 py-1.5 shadow-sm">Actualizado {updatedLabel}</span>
              <DashboardExportButton exportData={exportData} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-white px-4 py-1.5 shadow-sm">Periodo: {periodLabel}</span>
            {activeCategory ? (
              <span className="rounded-full bg-indigo-50 px-4 py-1.5 text-indigo-600 shadow-sm">Categoría: {activeCategory}</span>
            ) : null}
            {activeLocation ? (
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-emerald-600 shadow-sm">Ubicación: {activeLocation}</span>
            ) : null}
            {statusLabel ? (
              <span className="rounded-full bg-rose-50 px-4 py-1.5 text-rose-600 shadow-sm">{statusLabel}</span>
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
