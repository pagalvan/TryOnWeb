import { addDays, endOfDay, formatISO, startOfDay } from "date-fns"

import { getSupabaseAdminClient } from "@/lib/supabase/server"
import {
  type DashboardOverview,
  type DashboardFiltersInput,
  type DashboardFiltersState,
  type ReportsOverview,
  type LowStockProduct,
  type InventoryMovement,
  type ProductTrafficItem,
  type TopProductStat,
  type CategoryDistributionItem,
  type DemandTrendPoint,
  type InventoryFlowPoint,
  type TryOnTrendPoint,
  type DashboardAvailableFilters,
  type LocationSummary,
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
    valor_unitario,
    categoria_id
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
      sku,
      categoria_id
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
    sku,
    categoria_id
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

type MaybeArray<T> = T | T[]

type InventoryProductRecord = {
  id: string
  nombre: string
  sku: string | null
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
  prendas: MaybeArray<InventoryProductRecord> | null
}

type CategoryRecord = {
  id: string
  nombre: string
  estado: string
  prendas?: Array<{ id: string }>
}

type TryOnItemRecord = {
  id: string
  prenda_id: string | null
  duracion_seg: number | null
  created_at: string | null
}

type TryOnSessionRecord = {
  id: string
  created_at: string | null
}

type ProductSummaryRecord = {
  id: string
  nombre: string
  sku: string | null
  categoria_id: string | null
}

type ProductEventRecord = {
  id: string
  prenda_id: string | null
  event_type: "view" | "tryon" | "favorite" | "share"
  created_at: string
  prendas: MaybeArray<ProductSummaryRecord> | null
}

type InventoryMovementRecord = {
  id: string
  tipo: string
  cantidad: number
  motivo: string | null
  referencia: string | null
  created_at: string
  inventario_items: MaybeArray<{
    ubicacion: string | null
    prendas: MaybeArray<ProductSummaryRecord> | null
  }> | null
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
  tryOnSessions: TryOnSessionRecord[]
  tryOnItems: TryOnItemRecord[]
  productEvents: ProductEventRecord[]
  inventoryMovements: InventoryMovementRecord[]
  reports: ReportRecord[]
}

const firstItem = <T,>(value: MaybeArray<T> | null | undefined): T | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

const parseCurrency = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) return 0
  if (typeof value === "number") return value
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeDashboardFilters = (filters?: DashboardFiltersInput): DashboardFiltersState => {
  const now = new Date()
  const defaultTo = endOfDay(now)
  const defaultFrom = startOfDay(addDays(defaultTo, -29))

  const parse = (value?: string | null) => {
    if (!value) return null
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      return null
    }
    return parsed
  }

  let fromDate = startOfDay(parse(filters?.from) ?? defaultFrom)
  let toDate = endOfDay(parse(filters?.to) ?? defaultTo)

  if (fromDate > toDate) {
    const swap = fromDate
    fromDate = startOfDay(toDate)
    toDate = endOfDay(swap)
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    categoryId: filters?.categoryId ?? null,
    location: filters?.location ?? null,
    stockStatus: filters?.stockStatus ?? "all",
  }
}

const isWithinRange = (value: string | null | undefined, from: Date, to: Date) => {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date >= from && date <= to
}

const formatDateKey = (value: string | Date | null | undefined) => {
  if (!value) return null
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date?.getTime?.())) return null
  return formatISO(startOfDay(date as Date), { representation: "date" })
}

const computeDemandTrend = (
  events: ProductEventRecord[],
  from: Date,
  to: Date,
): DemandTrendPoint[] => {
  const map = new Map<string, { views: number; tryons: number }>()

  for (const event of events) {
    const key = formatDateKey(event.created_at)
    if (!key) continue

    const bucket = map.get(key) ?? { views: 0, tryons: 0 }
    if (event.event_type === "view") {
      bucket.views += 1
    }
    if (event.event_type === "tryon") {
      bucket.tryons += 1
    }
    map.set(key, bucket)
  }

  const startDate = startOfDay(from)
  const endDate = startOfDay(to)
  const result: DemandTrendPoint[] = []

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const key = formatISO(cursor, { representation: "date" })
    const bucket = map.get(key) ?? { views: 0, tryons: 0 }
    result.push({ date: key, views: bucket.views, tryons: bucket.tryons })
  }

  return result
}

const computeInventoryFlowTrend = (
  movements: InventoryMovementRecord[],
  from: Date,
  to: Date,
): InventoryFlowPoint[] => {
  const map = new Map<string, { inbound: number; outbound: number }>()

  for (const movement of movements) {
    const key = formatDateKey(movement.created_at)
    if (!key) continue

    const bucket = map.get(key) ?? { inbound: 0, outbound: 0 }
    const type = movement.tipo?.toLowerCase?.() ?? ""
    const quantity = movement.cantidad ?? 0

    if (type.includes("salida") || type.includes("egreso") || type.includes("baja")) {
      bucket.outbound += quantity
    } else {
      bucket.inbound += quantity
    }

    map.set(key, bucket)
  }

  const startDate = startOfDay(from)
  const endDate = startOfDay(to)
  const result: InventoryFlowPoint[] = []

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const key = formatISO(cursor, { representation: "date" })
    const bucket = map.get(key) ?? { inbound: 0, outbound: 0 }
    result.push({ date: key, inbound: bucket.inbound, outbound: bucket.outbound })
  }

  return result
}

const computeTryOnTrend = (
  sessions: TryOnSessionRecord[],
  items: TryOnItemRecord[],
  from: Date,
  to: Date,
): TryOnTrendPoint[] => {
  const sessionMap = new Map<string, number>()
  const itemMap = new Map<string, number>()

  for (const session of sessions) {
    const key = formatDateKey(session.created_at)
    if (!key) continue
    sessionMap.set(key, (sessionMap.get(key) ?? 0) + 1)
  }

  for (const item of items) {
    const key = formatDateKey(item.created_at)
    if (!key) continue
    itemMap.set(key, (itemMap.get(key) ?? 0) + 1)
  }

  const startDate = startOfDay(from)
  const endDate = startOfDay(to)
  const result: TryOnTrendPoint[] = []

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const key = formatISO(cursor, { representation: "date" })
    result.push({
      date: key,
      sessions: sessionMap.get(key) ?? 0,
      items: itemMap.get(key) ?? 0,
    })
  }

  return result
}

const computeLowStockProducts = (inventory: InventoryRecord[]): LowStockProduct[] => {
  const map = new Map<string, LowStockProduct & { hasNonOk: boolean }>()

  for (const item of inventory) {
    const product = firstItem(item.prendas)
    if (!product) {
      continue
    }

    const quantity = item.cantidad ?? 0
    const minimum = item.cantidad_minima ?? 0
    const productId = product.id

    let entry = map.get(productId)
    if (!entry) {
      entry = {
        productId,
        productName: product.nombre,
        sku: product.sku,
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
    const product = firstItem(event.prendas)
    const productId = event.prenda_id ?? product?.id
    if (!productId) continue

    const entry = stats.get(productId) ?? {
      productId,
      productName: product?.nombre ?? "Producto sin nombre",
      sku: product?.sku ?? null,
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
  records.map((movement) => {
    const inventoryItem = firstItem(movement.inventario_items)
    const product = inventoryItem ? firstItem(inventoryItem.prendas) : null

    return {
      id: movement.id,
      type: movement.tipo,
      quantity: movement.cantidad,
      motive: movement.motivo,
      reference: movement.referencia,
      productId: product?.id ?? null,
      productName: product?.nombre ?? null,
      sku: product?.sku ?? null,
      location: inventoryItem?.ubicacion ?? null,
      timestamp: movement.created_at,
    }
  })

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
      supabase
        .from("tryon_sessions")
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("tryon_items")
        .select("id, prenda_id, duracion_seg, created_at")
        .order("created_at", { ascending: false })
        .limit(1000),
      supabase.from("product_events").select(PRODUCT_EVENTS_SELECT).order("created_at", { ascending: false }).limit(500),
      supabase
        .from("inventario_movimientos")
        .select(MOVEMENTS_SELECT)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("reportes").select("id, tipo, created_at, parametros, payload").order("created_at", { ascending: false }).limit(10),
    ])

  return {
    products: Array.isArray(productsRes.data) ? (productsRes.data as ProductRecord[]) : [],
    inventory: Array.isArray(inventoryRes.data) ? (inventoryRes.data as InventoryRecord[]) : [],
    categories: Array.isArray(categoriesRes.data) ? (categoriesRes.data as CategoryRecord[]) : [],
    tryOnSessions: Array.isArray(tryOnSessionsRes.data) ? (tryOnSessionsRes.data as TryOnSessionRecord[]) : [],
    tryOnItems: Array.isArray(tryOnItemsRes.data) ? (tryOnItemsRes.data as TryOnItemRecord[]) : [],
    productEvents: Array.isArray(eventsRes.data) ? (eventsRes.data as ProductEventRecord[]) : [],
    inventoryMovements: Array.isArray(movementsRes.data) ? (movementsRes.data as InventoryMovementRecord[]) : [],
    reports: Array.isArray(reportsRes.data) ? (reportsRes.data as ReportRecord[]) : [],
  }
}

export const getDashboardOverview = async (filters?: DashboardFiltersInput): Promise<DashboardOverview> => {
  const raw = await fetchRawAnalyticsData()

  const normalizedFilters = normalizeDashboardFilters(filters)
  const fromDate = new Date(normalizedFilters.from)
  const toDate = new Date(normalizedFilters.to)

  const productMap = new Map(raw.products.map((product) => [product.id, product]))
  const categoryMap = new Map(raw.categories.map((category) => [category.id, category.nombre]))
  const UNCATEGORIZED_KEY = "__uncategorized__"

  const filteredInventory = raw.inventory.filter((item) => {
    if (normalizedFilters.location && item.ubicacion !== normalizedFilters.location) {
      return false
    }

    if (!normalizedFilters.categoryId) {
      return true
    }

    const product = firstItem(item.prendas)
    const productId = product?.id ?? item.prenda_id ?? null
    if (!productId) {
      return false
    }

    const categoryId = product?.categoria_id ?? productMap.get(productId)?.categoria_id ?? null
    return categoryId === normalizedFilters.categoryId
  })

  const filteredMovementsRecords = raw.inventoryMovements.filter((movement) => {
    if (!isWithinRange(movement.created_at, fromDate, toDate)) {
      return false
    }

    const inventoryItem = firstItem(movement.inventario_items)

    if (normalizedFilters.location && inventoryItem?.ubicacion !== normalizedFilters.location) {
      return false
    }

    if (!normalizedFilters.categoryId) {
      return true
    }

    const product = inventoryItem ? firstItem(inventoryItem.prendas) : null
    const productId = product?.id ?? null
    const categoryId = product?.categoria_id ?? (productId ? productMap.get(productId)?.categoria_id ?? null : null)

    return categoryId === normalizedFilters.categoryId
  })

  const filteredProductEvents = raw.productEvents.filter((event) => {
    if (!isWithinRange(event.created_at, fromDate, toDate)) {
      return false
    }

    if (!normalizedFilters.categoryId) {
      return true
    }

    const product = firstItem(event.prendas)
    const productId = event.prenda_id ?? product?.id ?? null
    const categoryId = product?.categoria_id ?? (productId ? productMap.get(productId)?.categoria_id ?? null : null)

    return categoryId === normalizedFilters.categoryId
  })

  const filteredTryOnItems = raw.tryOnItems.filter((item) => {
    if (!isWithinRange(item.created_at, fromDate, toDate)) {
      return false
    }

    if (!normalizedFilters.categoryId) {
      return true
    }

    const productId = item.prenda_id ?? null
    if (!productId) {
      return false
    }

    const categoryId = productMap.get(productId)?.categoria_id ?? null
    return categoryId === normalizedFilters.categoryId
  })

  const filteredTryOnSessions = raw.tryOnSessions.filter((session) => isWithinRange(session.created_at, fromDate, toDate))

  const totalInventoryValue = filteredInventory.reduce((acc, item) => {
    const quantity = item.cantidad ?? 0
    const product = firstItem(item.prendas)
    const productId = product?.id ?? item.prenda_id ?? null
    const priceSource = product ?? (productId ? productMap.get(productId) : null)
    const price = parseCurrency(priceSource?.valor_unitario)
    return acc + quantity * price
  }, 0)

  const totalStockUnits = filteredInventory.reduce((acc, item) => acc + (item.cantidad ?? 0), 0)

  const uniqueProductIds = new Set<string>()
  for (const item of filteredInventory) {
    const product = firstItem(item.prendas)
    const productId = product?.id ?? item.prenda_id
    if (productId) {
      uniqueProductIds.add(productId)
    }
  }

  const lowStockAll = computeLowStockProducts(filteredInventory)
  const lowStockFiltered =
    normalizedFilters.stockStatus === "all"
      ? lowStockAll
      : lowStockAll.filter((item) => item.status === normalizedFilters.stockStatus)

  const locationStats = new Map<
    string,
    {
      totalUnits: number
      inventoryValue: number
      productIds: Set<string>
      lowStockCount: number
      criticalCount: number
    }
  >()

  for (const item of filteredInventory) {
    const locationKey = item.ubicacion?.trim() ? item.ubicacion.trim() : "Sin ubicación"
    const quantity = item.cantidad ?? 0
    const minimum = item.cantidad_minima ?? 0
    const status = item.estado?.toLowerCase?.() ?? "ok"
    const product = firstItem(item.prendas)
    const productId = product?.id ?? item.prenda_id ?? null
    const priceSource = product ?? (productId ? productMap.get(productId) : null)
    const price = parseCurrency(priceSource?.valor_unitario)

    let entry = locationStats.get(locationKey)
    if (!entry) {
      entry = {
        totalUnits: 0,
        inventoryValue: 0,
        productIds: new Set<string>(),
        lowStockCount: 0,
        criticalCount: 0,
      }
      locationStats.set(locationKey, entry)
    }

    entry.totalUnits += quantity
    entry.inventoryValue += quantity * price
    if (productId) {
      entry.productIds.add(productId)
    }

    const isCritical = status === "sin_stock" || quantity <= 0
    const isLowStock = isCritical || status === "bajo" || quantity <= minimum

    if (isLowStock) {
      entry.lowStockCount += 1
    }

    if (isCritical) {
      entry.criticalCount += 1
    }
  }

  const locations: LocationSummary[] = Array.from(locationStats.entries())
    .map(([location, stats]) => ({
      location,
      totalUnits: stats.totalUnits,
      inventoryValue: stats.inventoryValue,
      productCount: stats.productIds.size,
      lowStockCount: stats.lowStockCount,
      criticalCount: stats.criticalCount,
    }))
    .sort((a, b) => b.totalUnits - a.totalUnits)

  const categoryProductMap = new Map<string, Set<string>>()
  for (const item of filteredInventory) {
    const product = firstItem(item.prendas)
    const productId = product?.id ?? item.prenda_id ?? null
    if (!productId) continue

    const categoryId = product?.categoria_id ?? productMap.get(productId)?.categoria_id ?? null
    const key = categoryId ?? UNCATEGORIZED_KEY
    const current = categoryProductMap.get(key) ?? new Set<string>()
    current.add(productId)
    categoryProductMap.set(key, current)
  }

  const availableFilters: DashboardAvailableFilters = {
    categories: raw.categories
      .filter((category) => category.estado !== "inactiva")
      .map((category) => ({ id: category.id, nombre: category.nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
    locations: Array.from(new Set(raw.inventory.map((item) => item.ubicacion).filter((value): value is string => Boolean(value)))).sort((a, b) =>
      a.localeCompare(b, "es"),
    ),
  }

  const categories = normalizedFilters.location
    ? Array.from(categoryProductMap.entries())
        .map(([categoryId, products]) => ({
          id: categoryId === UNCATEGORIZED_KEY ? "sin-categoria" : categoryId,
          nombre:
            categoryId === UNCATEGORIZED_KEY
              ? "Sin categoría"
              : categoryMap.get(categoryId) ?? "Sin categoría",
          productCount: products.size,
        }))
        .sort((a, b) => b.productCount - a.productCount)
    : raw.categories
        .filter((category) => !normalizedFilters.categoryId || category.id === normalizedFilters.categoryId)
        .map((category) => ({
          id: category.id,
          nombre: category.nombre,
          productCount: Array.isArray(category.prendas) ? category.prendas.length : 0,
        }))
        .sort((a, b) => b.productCount - a.productCount)

  const sortedMovements = [...filteredMovementsRecords].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime()
    const timeB = new Date(b.created_at).getTime()
    return timeB - timeA
  })

  const tryOnTotalDuration = filteredTryOnItems.reduce((acc, item) => acc + (item.duracion_seg ?? 0), 0)
  const tryOnUniqueProducts = new Set(filteredTryOnItems.map((item) => item.prenda_id).filter((id): id is string => Boolean(id))).size

  return {
    context: {
      generatedAt: new Date().toISOString(),
      filters: normalizedFilters,
      availableFilters,
    },
    metrics: {
      totalProducts:
        normalizedFilters.categoryId || normalizedFilters.location ? uniqueProductIds.size : raw.products.length,
      activeProducts: raw.products.filter((product) => {
        if (product.estado === "inactiva") return false
        if (normalizedFilters.categoryId && product.categoria_id !== normalizedFilters.categoryId) return false
        if (normalizedFilters.location && !uniqueProductIds.has(product.id)) return false
        return true
      }).length,
      totalCategories: normalizedFilters.location
        ? categoryProductMap.size
        : normalizedFilters.categoryId
          ? raw.categories.filter((category) => category.id === normalizedFilters.categoryId).length
          : raw.categories.length,
      totalStockUnits,
      totalInventoryValue,
      lowStockProducts: lowStockAll.length,
      tryOnSessions: filteredTryOnSessions.length,
      tryOnItems: filteredTryOnItems.length,
    },
    categories,
    locations,
    inventory: {
      lowStock: lowStockFiltered,
      movements: mapMovements(sortedMovements).slice(0, 8),
    },
    productTraffic: computeProductTraffic(filteredProductEvents),
    topProducts: computeTopProducts(filteredProductEvents),
    demandTrend: computeDemandTrend(filteredProductEvents, fromDate, toDate),
    inventoryFlow: computeInventoryFlowTrend(filteredMovementsRecords, fromDate, toDate),
    tryOn: {
      summary: {
        sessions: filteredTryOnSessions.length,
        items: filteredTryOnItems.length,
        averageDurationSeconds: filteredTryOnItems.length > 0 ? tryOnTotalDuration / filteredTryOnItems.length : 0,
        uniqueProducts: tryOnUniqueProducts,
      },
      trend: computeTryOnTrend(filteredTryOnSessions, filteredTryOnItems, fromDate, toDate),
    },
  }
}

export const getReportsOverview = async (): Promise<ReportsOverview> => {
  const raw = await fetchRawAnalyticsData()

  const lowStock = computeLowStockProducts(raw.inventory)
  const totalInventoryValue = raw.inventory.reduce((acc, item) => {
    const quantity = item.cantidad ?? 0
    const product = firstItem(item.prendas)
    const price = parseCurrency(product?.valor_unitario)
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
      sessions: raw.tryOnSessions.length,
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
