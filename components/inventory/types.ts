export type ProductFormState = {
  id: string | null
  nombre: string
  sku: string
  categoriaId: string
  precio: string
  descripcion: string
  estado: string
  destacado: boolean
  imageUrl: string
  lensId: string
  stockInicial: string
  bodegaId: string
  tallas: string
  colores: string
}

export type StockFormState = {
  productId: string
  itemId: string | null
  bodegaId: string
  cantidad: string
  cantidadMinima: string
  estado: string
}

export type InitialFormOptions = {
  locationId?: string
}

export const PRODUCT_STATUS_OPTIONS = [
  { value: "disponible", label: "Disponible" },
  { value: "reservada", label: "Reservada" },
  { value: "inactiva", label: "Inactiva" },
]

export const INVENTORY_STATUS_OPTIONS = [
  { value: "ok", label: "OK" },
  { value: "bajo", label: "Bajo" },
  { value: "sin_stock", label: "Sin stock" },
  { value: "bloqueado", label: "Bloqueado" },
]
