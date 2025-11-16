import { getSupabaseAdminClient } from "@/lib/supabase/server"
import {
  type DashboardOverview,
  type ReportsOverview,
  type LowStockProduct,
  type InventoryMovement,
  type ProductTrafficItem,
  type TopProductStat,
  type CategoryDistributionItem,
} from "@/lib/types/analytics"

const INVENTORY_SELECT = `
  id,
  prenda_id,
  cantidad,
  cantidad_minima,
  estado,
  ubicacion,
  updated_at,
  prendas:prenda_id (
    id,
    nombre,
    sku,
    valor_unitario
  )
`

const MOVEMENTS_SELECT = `
  id,
  tipo,
  cantidad,
  motivo,
  referencia,
  metadata,
  created_at,
  inventario_items:inventario_id (
    ubicacion,
    prendas:prenda_id (
      id,
      nombre,
      sku
    )
  )
`

const PRODUCT_EVENTS_SELECT = `
  id,
  prenda_id,
  event_type,
  created_at,
  prendas:prenda_id (
    id,
    nombre,
    sku
  )
`

type ProductRecord = {
  id: string
  nombre: string
  sku: string | null
  estado: string
  valor_unitario: number | string | null
  categoria_id: string | null
}

type InventoryRecord = {
  id: string
  prenda_id: string
  cantidad: number | null
  cantidad_minima: number | null
  estado: string | null
  ubicacion: string
  updated_at: string | null
  prendas: {
    id: string
    nombre: string
    sku: string | null
    valor_unitario: number | string | null
  } | null
}

type CategoryRecord = {
  id: string
  nombre: string
  estado: string
  prendas?: Array<{ id: string }>
}

type TryOnItemRecord = {
  id: string
  prenda_id: string
  duracion_seg: number | null
}

type ProductEventRecord = {
  id: string
  prenda_id: string | null
  event_type: "view" | "tryon" | "favorite" | "share"
  created_at: string
  prendas: {
    id: string
    nombre: string
    sku: string | null
  } | null
}

type InventoryMovementRecord = {
  id: string
  tipo: string
  cantidad: number
  motivo: string | null
  referencia: string | null
  created_at: string
  inventario_items: {
    ubicacion: string | null
    prendas: {
      id: string
      nombre: string
      sku: string | null
    } | null
  } | null
}

type ReportRecord = {
  id: string
  tipo: string
  created_at: string
  parametros: Record<string, unknown> | null
  payload: Record<string, unknown> | null
}

type RawAnalyticsData = {
  products: ProductRecord[]
  inventory: InventoryRecord[]
  categories: CategoryRecord[]
  tryOnSessions: number
  tryOnItems: TryOnItemRecord[]
  productEvents: ProductEventRecord[]
  inventoryMovements: InventoryMovementRecord[]
  reports: ReportRecord[]
}

const parseCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const computeLowStockProducts = (inventory: InventoryRecord[]): LowStockProduct[] => {
  const map = new Map<string, LowStockProduct & { hasNonOk: boolean }>()

  for (const item of inventory) {
    if (!item.prendas) {
      continue
    }

    const quantity = item.cantidad ?? 0
    const minimum = item.cantidad_minima ?? 0
    const productId = item.prendas.id

    let entry = map.get(productId)
    if (!entry) {
      entry = {
        productId,
        productName: item.prendas.nombre,
        sku: item.prendas.sku,
        totalStock: 0,
        minimumStock: 0,
        status: "warning",
        locations: [],
        hasNonOk: false,
      }
      map.set(productId, entry)
    }

    entry.totalStock += quantity
    entry.minimumStock += minimum
    entry.locations.push({
      id: item.id,
      location: item.ubicacion,
      quantity,
      minimum,
      status: item.estado ?? "ok",
      updatedAt: item.updated_at,
    })

    if (item.estado && item.estado !== "ok") {
      entry.hasNonOk = true
    }
  }

  const result: LowStockProduct[] = []

  for (const entry of map.values()) {
    const belowThreshold = entry.totalStock <= entry.minimumStock
    const anyLocationBelow = entry.locations.some((location) => location.quantity <= location.minimum)
    const zeroStock = entry.totalStock <= 0
    const status: "warning" | "critical" = zeroStock ? "critical" : "warning"

    if (belowThreshold || anyLocationBelow || entry.hasNonOk || zeroStock) {
      result.push({
        productId: entry.productId,
        productName: entry.productName,
        sku: entry.sku,
        totalStock: entry.totalStock,
        minimumStock: entry.minimumStock,
        status,
        locations: entry.locations,
      })
    }
  }

  return result.sort((a, b) => a.totalStock - b.totalStock)
}

const computeProductTraffic = (events: ProductEventRecord[]): ProductTrafficItem[] => {
  const counter: Record<ProductTrafficItem["type"], number> = {
    view: 0,
    tryon: 0,
    favorite: 0,
    share: 0,
  }

  for (const event of events) {
    if (counter[event.event_type] !== undefined) {
      counter[event.event_type] += 1
    }
  }

  return [
    { type: "view", label: "Vistas", count: counter.view },
    { type: "tryon", label: "Try-on", count: counter.tryon },
    { type: "favorite", label: "Favoritos", count: counter.favorite },
    { type: "share", label: "Compartidos", count: counter.share },
  ]
}

const computeTopProducts = (events: ProductEventRecord[]): TopProductStat[] => {
  const stats = new Map<string, TopProductStat>()

  for (const event of events) {
    const productId = event.prenda_id ?? event.prendas?.id
    if (!productId) continue

    const entry = stats.get(productId) ?? {
      productId,
      productName: event.prendas?.nombre ?? "Producto sin nombre",
      sku: event.prendas?.sku ?? null,
      views: 0,
      tryons: 0,
      favorites: 0,
      shares: 0,
    }

    switch (event.event_type) {
      case "view":
        entry.views += 1
        break
      case "tryon":
        entry.tryons += 1
        break
      case "favorite":
        entry.favorites += 1
        break
      case "share":
        entry.shares += 1
        break
      default:
        break
    }

    stats.set(productId, entry)
  }

  return Array.from(stats.values())
    .sort((a, b) => {
      if (b.tryons !== a.tryons) return b.tryons - a.tryons
      return b.views - a.views
    })
    .slice(0, 5)
}

const computeCategoryDistribution = (categories: CategoryRecord[]): CategoryDistributionItem[] => {
  const totals = categories.map((category) => ({
    id: category.id,
    nombre: category.nombre,
    productCount: Array.isArray(category.prendas) ? category.prendas.length : 0,
  }))

  const totalProducts = totals.reduce((acc, current) => acc + current.productCount, 0) || 1

  return totals
    .map((item) => ({
      ...item,
      percentage: Math.round((item.productCount / totalProducts) * 1000) / 10,
    }))
    .sort((a, b) => b.productCount - a.productCount)
}

const mapMovements = (records: InventoryMovementRecord[]): InventoryMovement[] =>
  records.map((movement) => ({
    id: movement.id,
    type: movement.tipo,
    quantity: movement.cantidad,
    motive: movement.motivo,
    reference: movement.referencia,
    productId: movement.inventario_items?.prendas?.id ?? null,
    productName: movement.inventario_items?.prendas?.nombre ?? null,
    sku: movement.inventario_items?.prendas?.sku ?? null,
    location: movement.inventario_items?.ubicacion ?? null,
    timestamp: movement.created_at,
  }))

const mapRecentReports = (records: ReportRecord[]) =>
  records.map((report) => ({
    id: report.id,
    type: report.tipo,
    createdAt: report.created_at,
    summary: typeof report.payload?.resumen === "string" ? report.payload?.resumen : null,
  }))

const fetchRawAnalyticsData = async (): Promise<RawAnalyticsData> => {
  const supabase = getSupabaseAdminClient()

  const [productsRes, inventoryRes, categoriesRes, tryOnSessionsRes, tryOnItemsRes, eventsRes, movementsRes, reportsRes] =
    await Promise.all([
      supabase.from("prendas").select("id, nombre, sku, estado, valor_unitario, categoria_id"),
      supabase.from("inventario_items").select(INVENTORY_SELECT),
      supabase.from("categorias").select("id, nombre, estado, prendas:prendas ( id )"),
      supabase.from("tryon_sessions").select("id", { count: "exact", head: true }),
      supabase.from("tryon_items").select("id, prenda_id, duracion_seg"),
      supabase.from("product_events").select(PRODUCT_EVENTS_SELECT).order("created_at", { ascending: false }).limit(500),
      supabase
        .from("inventario_movimientos")
        .select(MOVEMENTS_SELECT)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("reportes").select("id, tipo, created_at, parametros, payload").order("created_at", { ascending: false }).limit(10),
    ])

  return {
    products: productsRes.data ?? [],
    inventory: inventoryRes.data ?? [],
    categories: categoriesRes.data ?? [],
    tryOnSessions: tryOnSessionsRes.count ?? 0,
    tryOnItems: tryOnItemsRes.data ?? [],
    productEvents: eventsRes.data ?? [],
    inventoryMovements: movementsRes.data ?? [],
    reports: reportsRes.data ?? [],
  }
}

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const raw = await fetchRawAnalyticsData()

  const totalInventoryValue = raw.inventory.reduce((acc, item) => {
    const quantity = item.cantidad ?? 0
    const price = parseCurrency(item.prendas?.valor_unitario)
    return acc + quantity * price
  }, 0)

  const totalStockUnits = raw.inventory.reduce((acc, item) => acc + (item.cantidad ?? 0), 0)
  const lowStock = computeLowStockProducts(raw.inventory)
  const movements = mapMovements(raw.inventoryMovements).slice(0, 5)

  return {
    metrics: {
      totalProducts: raw.products.length,
      activeProducts: raw.products.filter((product) => product.estado !== "inactiva").length,
      totalCategories: raw.categories.length,
      totalStockUnits,
      totalInventoryValue,
      lowStockProducts: lowStock.length,
      tryOnSessions: raw.tryOnSessions,
      tryOnItems: raw.tryOnItems.length,
    },
    categories: raw.categories
      .map((category) => ({
        id: category.id,
        nombre: category.nombre,
        productCount: Array.isArray(category.prendas) ? category.prendas.length : 0,
      }))
      .sort((a, b) => b.productCount - a.productCount),
    inventory: {
      lowStock,
      movements,
    },
    productTraffic: computeProductTraffic(raw.productEvents),
  }
}

export const getReportsOverview = async (): Promise<ReportsOverview> => {
  const raw = await fetchRawAnalyticsData()

  const lowStock = computeLowStockProducts(raw.inventory)
  const totalInventoryValue = raw.inventory.reduce((acc, item) => {
    const quantity = item.cantidad ?? 0
    const price = parseCurrency(item.prendas?.valor_unitario)
    return acc + quantity * price
  }, 0)

  const totalStockUnits = raw.inventory.reduce((acc, item) => acc + (item.cantidad ?? 0), 0)
  const traffic = computeProductTraffic(raw.productEvents)
  const topProducts = computeTopProducts(raw.productEvents)
  const categoryDistribution = computeCategoryDistribution(raw.categories)

  const totalViews = traffic.find((item) => item.type === "view")?.count ?? 0
  const totalTryOns = traffic.find((item) => item.type === "tryon")?.count ?? 0
  const conversionRate = totalViews > 0 ? Math.round((totalTryOns / totalViews) * 1000) / 10 : 0

  const totalDuration = raw.tryOnItems.reduce((acc, item) => acc + (item.duracion_seg ?? 0), 0)
  const uniqueTryOnProducts = new Set(raw.tryOnItems.map((item) => item.prenda_id)).size
  const averageDuration = raw.tryOnItems.length > 0 ? totalDuration / raw.tryOnItems.length : 0

  return {
    metrics: {
      inventoryValue: totalInventoryValue,
      stockUnits: totalStockUnits,
      activeProducts: raw.products.filter((product) => product.estado !== "inactiva").length,
      conversionRate,
    },
    tryOn: {
      sessions: raw.tryOnSessions,
      items: raw.tryOnItems.length,
      averageDurationSeconds: averageDuration,
      uniqueProducts: uniqueTryOnProducts,
    },
    topProducts,
    categoryDistribution,
    lowStock,
    traffic,
    recentReports: mapRecentReports(raw.reports).slice(0, 5),
  }
}
