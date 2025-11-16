import { apiFetch } from "@/lib/api-client"

export type Category = {
  id: string
  nombre: string
  descripcion: string | null
  estado: "activa" | "inactiva"
  icon: string | null
  productCount: number
}

export type CategoryPayload = {
  nombre: string
  descripcion?: string | null
  estado?: "activa" | "inactiva"
  icon?: string | null
}

export type CategoryUpdatePayload = Partial<CategoryPayload>

type CategoryResponse = {
  data: Category | null | undefined
}

type CategoryListResponse = {
  data: Category[] | null | undefined
}

type MessageResponse = {
  message: string
}

const normalizeCreatePayload = (payload: CategoryPayload) => {
  const nombre = payload.nombre.trim()
  const descripcion = payload.descripcion?.trim()
  const icon = payload.icon?.trim()

  return {
    nombre,
    descripcion: descripcion && descripcion.length > 0 ? descripcion : undefined,
    estado: payload.estado ?? "activa",
    icon: icon && icon.length > 0 ? icon : undefined,
  }
}

const normalizeUpdatePayload = (payload: CategoryUpdatePayload) => {
  const data: Record<string, unknown> = {}

  if (payload.nombre !== undefined) {
    const value = payload.nombre.trim()
    if (value.length > 0) data.nombre = value
  }

  if (payload.descripcion !== undefined) {
    if (typeof payload.descripcion === "string") {
      const value = payload.descripcion.trim()
      data.descripcion = value.length > 0 ? value : undefined
    } else {
      data.descripcion = undefined
    }
  }
  if (payload.estado !== undefined) data.estado = payload.estado
  if (payload.icon !== undefined) {
    if (typeof payload.icon === "string") {
      const value = payload.icon.trim()
      data.icon = value.length > 0 ? value : undefined
    } else {
      data.icon = undefined
    }
  }

  return data
}

export async function listCategories(): Promise<Category[]> {
  const response = await apiFetch<CategoryListResponse>("/api/categories")
  return response.data ?? []
}

export async function getCategory(id: string): Promise<Category | null> {
  const response = await apiFetch<CategoryResponse>(`/api/categories/${id}`)
  return response.data ?? null
}

export async function createCategory(payload: CategoryPayload): Promise<Category | null> {
  const response = await apiFetch<CategoryResponse>("/api/categories", {
    method: "POST",
    body: JSON.stringify(normalizeCreatePayload(payload)),
  })
  return response.data ?? null
}

export async function updateCategory(id: string, payload: CategoryUpdatePayload): Promise<Category | null> {
  const response = await apiFetch<CategoryResponse>(`/api/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(normalizeUpdatePayload(payload)),
  })
  return response.data ?? null
}

export async function deleteCategory(id: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/api/categories/${id}`, {
    method: "DELETE",
  })
}
