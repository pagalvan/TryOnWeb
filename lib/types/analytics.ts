export type LowStockLocation = {
  id: string
  location: string
  quantity: number
  minimum: number
  status: string
  updatedAt: string | null
}

export type LowStockProduct = {
  productId: string
  productName: string
  sku: string | null
  totalStock: number
  minimumStock: number
  status: "warning" | "critical"
  locations: LowStockLocation[]
}

export type InventoryMovement = {
  id: string
  type: string
  quantity: number
  motive: string | null
  reference: string | null
  productId: string | null
  productName: string | null
  sku: string | null
  location: string | null
  timestamp: string
}

export type ProductTrafficItem = {
  type: "view" | "tryon" | "favorite" | "share"
  label: string
  count: number
}

export type DashboardFilterStatus = "all" | "warning" | "critical"

export type DashboardFiltersInput = Partial<{
  from: string
  to: string
  categoryId: string | null
  location: string | null
  stockStatus: DashboardFilterStatus
}>

export type DashboardFiltersState = {
  from: string
  to: string
  categoryId: string | null
  location: string | null
  stockStatus: DashboardFilterStatus
}

export type DashboardAvailableFilters = {
  categories: Array<{ id: string; nombre: string }>
  locations: string[]
}

export type DemandTrendPoint = {
  date: string
  views: number
  tryons: number
}

export type InventoryFlowPoint = {
  date: string
  inbound: number
  outbound: number
}

export type TryOnTrendPoint = {
  date: string
  sessions: number
  items: number
}

export type DashboardMetrics = {
  totalProducts: number
  activeProducts: number
  totalCategories: number
  totalStockUnits: number
  totalInventoryValue: number
  lowStockProducts: number
  tryOnSessions: number
  tryOnItems: number
}

export type LocationSummary = {
  location: string
  totalUnits: number
  inventoryValue: number
  productCount: number
  lowStockCount: number
  criticalCount: number
}

export type DashboardOverview = {
  context: {
    generatedAt: string
    filters: DashboardFiltersState
    availableFilters: DashboardAvailableFilters
  }
  metrics: DashboardMetrics
  categories: Array<{ id: string; nombre: string; productCount: number }>
  locations: LocationSummary[]
  inventory: {
    lowStock: LowStockProduct[]
    movements: InventoryMovement[]
  }
  productTraffic: ProductTrafficItem[]
  topProducts: TopProductStat[]
  demandTrend: DemandTrendPoint[]
  inventoryFlow: InventoryFlowPoint[]
  tryOn: {
    summary: TryOnStats
    trend: TryOnTrendPoint[]
  }
}

export type TopProductStat = {
  productId: string
  productName: string
  sku: string | null
  views: number
  tryons: number
  favorites: number
  shares: number
}

export type CategoryDistributionItem = {
  id: string
  nombre: string
  productCount: number
  percentage: number
}

export type TryOnStats = {
  sessions: number
  items: number
  averageDurationSeconds: number
  uniqueProducts: number
}

export type ReportsOverview = {
  metrics: {
    inventoryValue: number
    stockUnits: number
    activeProducts: number
    conversionRate: number
  }
  tryOn: TryOnStats
  topProducts: TopProductStat[]
  categoryDistribution: CategoryDistributionItem[]
  lowStock: LowStockProduct[]
  traffic: ProductTrafficItem[]
  recentReports: Array<{
    id: string
    type: string
    createdAt: string
    summary: string | null
  }>
}
