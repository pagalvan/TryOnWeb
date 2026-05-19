import { ResumenSection } from "@/components/dashboard/dashboard-sections"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { AdminGuard } from "@/components/auth/admin-guard"

import { loadDashboardContext } from "./_data"
import type { DashboardPageProps } from "./_data"

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const context = await loadDashboardContext(searchParams)

  return (
    <AdminGuard>
      <DashboardShell context={context} activeSection="resumen">
        <ResumenSection context={context} />
      </DashboardShell>
    </AdminGuard>
  )
}
