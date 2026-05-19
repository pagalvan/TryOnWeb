import { AlertasSection } from "@/components/dashboard/dashboard-sections"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

import { loadDashboardContext } from "@/app/dashboard/_data"
import type { DashboardPageProps } from "@/app/dashboard/_data"

export default async function DashboardAlertasPage({ searchParams }: DashboardPageProps) {
  const context = await loadDashboardContext(searchParams)

  return (
    <DashboardShell context={context} activeSection="alertas">
      <AlertasSection context={context} />
    </DashboardShell>
  )
}
