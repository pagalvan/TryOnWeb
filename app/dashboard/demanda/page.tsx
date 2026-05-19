import { DemandaSection } from "@/components/dashboard/dashboard-sections"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

import { loadDashboardContext } from "@/app/dashboard/_data"
import type { DashboardPageProps } from "@/app/dashboard/_data"

export default async function DashboardDemandaPage({ searchParams }: DashboardPageProps) {
  const context = await loadDashboardContext(searchParams)

  return (
    <DashboardShell context={context} activeSection="demanda">
      <DemandaSection context={context} />
    </DashboardShell>
  )
}
