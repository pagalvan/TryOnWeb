import { apiFetch } from "@/lib/api-client"
import { type DashboardOverview, type DashboardFiltersInput } from "@/lib/types/analytics"

type DashboardResponse = {
  data: DashboardOverview | null | undefined
}

const buildDashboardPath = (params?: DashboardFiltersInput) => {
  if (!params) return "/api/dashboard"

  const query = new URLSearchParams()

  if (params.from) query.set("from", params.from)
  if (params.to) query.set("to", params.to)
  if (params.categoryId) query.set("categoryId", params.categoryId)
  if (params.location) query.set("location", params.location)
  if (params.stockStatus) query.set("stockStatus", params.stockStatus)

  const queryString = query.toString()
  return queryString ? `/api/dashboard?${queryString}` : "/api/dashboard"
}

export const fetchDashboardOverview = async (params?: DashboardFiltersInput): Promise<DashboardOverview> => {
  const response = await apiFetch<DashboardResponse>(buildDashboardPath(params))
  if (!response.data) {
    throw new Error("No recibimos información del dashboard")
  }
  return response.data
}
