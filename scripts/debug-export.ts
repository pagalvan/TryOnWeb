import { loadEnvConfig } from "@next/env"
import fs from "node:fs/promises"

loadEnvConfig(process.cwd())

async function main() {
  const [{ createPdfBuffer, createExcelBuffer }, { getDashboardOverview, getReportsOverview }] = await Promise.all([
    import("@/app/api/dashboard/export/route"),
    import("@/lib/services/analytics.server"),
  ])

  const filters = {}
  const [dashboard, reports] = await Promise.all([
    getDashboardOverview(filters),
    getReportsOverview(),
  ])

  const payload = { dashboard, reports, filters }
  const pdf = await createPdfBuffer(payload)
  const excel = await createExcelBuffer(payload)

  await fs.mkdir(".tmp", { recursive: true })
  await fs.writeFile(".tmp/dashboard-report.pdf", pdf)
  await fs.writeFile(".tmp/dashboard-report.xlsx", excel)
}

main().catch((error) => {
  console.error("Debug export failed", error)
  process.exit(1)
})
