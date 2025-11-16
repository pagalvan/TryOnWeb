import { apiFetch } from "@/lib/api-client"
import { type DashboardOverview } from "@/lib/types/analytics"

type DashboardResponse = {
  data: DashboardOverview | null | undefined
}

export const fetchDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await apiFetch<DashboardResponse>("/api/dashboard")
  if (!response.data) {
    throw new Error("No recibimos información del dashboard")
  }
  return response.data
}
