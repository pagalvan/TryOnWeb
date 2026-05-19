import { InventarioSection } from "@/components/dashboard/dashboard-sections"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

import { loadDashboardContext } from "@/app/dashboard/_data"
import type { DashboardPageProps } from "@/app/dashboard/_data"

export default async function DashboardInventarioPage({ searchParams }: DashboardPageProps) {
  const context = await loadDashboardContext(searchParams)

  return (
    <DashboardShell context={context} activeSection="inventario">
      <InventarioSection context={context} />
    </DashboardShell>
  )
}
