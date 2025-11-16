import { apiFetch } from "@/lib/api-client"
import { type ReportsOverview } from "@/lib/types/analytics"

type ReportsResponse = {
  data: ReportsOverview | null | undefined
}

export const fetchReportsOverview = async (): Promise<ReportsOverview> => {
  const response = await apiFetch<ReportsResponse>("/api/reports")
  if (!response.data) {
    throw new Error("No recibimos información de reportes")
  }
  return response.data
}
