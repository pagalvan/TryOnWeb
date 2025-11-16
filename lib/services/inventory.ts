import { apiFetch } from "@/lib/api-client"
import {
  listCategories as fetchCategories,
  type Category as CategorySummary,
} from "@/lib/services/categories"

export type InventoryCategory = Pick<CategorySummary, "id" | "nombre">

export type InventoryItem = {
  id: string
  ubicacion: string
  cantidad: number
  cantidad_minima: number
  estado: string | null
}

export type InventoryProduct = {
  id: string
  nombre: string
  descripcion: string | null
  sku: string | null
  valor_unitario: number | null
  estado: string
  destacado: boolean
  categoria_id: string | null
  metadata: Record<string, unknown> | null
  categorias?: InventoryCategory | null
  inventario_items: InventoryItem[]
}

export type CreateProductPayload = {
  nombre: string
  sku?: string | null
  categoria_id?: string | null
  valor_unitario?: number | null
  descripcion?: string | null
  estado: string
  destacado: boolean
  metadata?: Record<string, unknown> | null
  stockInicial?: number
  ubicacion?: string
}

export type UpdateProductPayload = Partial<Omit<CreateProductPayload, "stockInicial" | "ubicacion">>

export type UpsertStockPayload = {
  itemId?: string | null
  ubicacion: string
  cantidad: number
  cantidad_minima: number
  estado: string
}

type ApiListResponse<T> = {
  data: T | null | undefined
}

type ApiMessageResponse = {
  message: string
}

export type ListProductsOptions = {
  search?: string
  categoryId?: string
}

export async function listProducts(options: ListProductsOptions = {}): Promise<InventoryProduct[]> {
  const params = new URLSearchParams()
  if (options.search) {
    params.set("search", options.search)
  }
  if (options.categoryId) {
    params.set("categoryId", options.categoryId)
  }

  const query = params.toString() ? `?${params.toString()}` : ""
  const response = await apiFetch<ApiListResponse<InventoryProduct[]>>(`/api/products${query}`)
  return response.data ?? []
}

export async function fetchInventoryOverview(): Promise<{
  products: InventoryProduct[]
  categories: InventoryCategory[]
}> {
  const [products, categories] = await Promise.all([listProducts(), fetchCategories()])
  return {
    products,
    categories: categories.map((category) => ({ id: category.id, nombre: category.nombre })),
  }
}

export async function createProduct(payload: CreateProductPayload): Promise<InventoryProduct | null> {
  const response = await apiFetch<ApiListResponse<InventoryProduct>>("/api/products", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  return response.data ?? null
}

export async function updateProduct(id: string, payload: UpdateProductPayload): Promise<InventoryProduct | null> {
  const response = await apiFetch<ApiListResponse<InventoryProduct | null>>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return response.data ?? null
}

export async function deleteProduct(id: string): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(`/api/products/${id}`, { method: "DELETE" })
}

export async function upsertProductStock(
  productId: string,
  payload: UpsertStockPayload
): Promise<InventoryProduct | null> {
  const response = await apiFetch<ApiListResponse<InventoryProduct | null>>(`/api/products/${productId}/stock`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
  return response.data ?? null
}

export async function deleteProductStock(productId: string, stockId: string): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>(`/api/products/${productId}/stock/${stockId}`, {
    method: "DELETE",
  })
}
