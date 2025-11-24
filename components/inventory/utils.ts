import type { InventoryProduct, InventoryProductMetadata, LensAsset, LensAssetInput } from "@/lib/services/inventory"
import type { InitialFormOptions, ProductFormState, StockFormState } from "./types"

export function getInitialProductForm(options: InitialFormOptions = {}): ProductFormState {
  return {
    id: null,
    nombre: "",
    sku: "",
    categoriaId: "",
    precio: "",
    descripcion: "",
    estado: "disponible",
    destacado: false,
    imageUrl: "",
    lensId: "",
    stockInicial: "0",
    bodegaId: options.locationId ?? "",
    tallas: "",
    colores: "",
  }
}

export function getInitialStockForm(options: InitialFormOptions = {}): StockFormState {
  return {
    productId: "",
    itemId: null,
    bodegaId: options.locationId ?? "",
    cantidad: "0",
    cantidadMinima: "0",
    estado: "ok",
  }
}

export function buildProductMetadata(
  form: ProductFormState,
  existing: InventoryProductMetadata | null
): InventoryProductMetadata | null {
  const metadata: InventoryProductMetadata = { ...(existing ?? {}) }
  const imageUrl = form.imageUrl.trim()

  if (imageUrl) {
    metadata.image_url = imageUrl
  } else {
    delete metadata.image_url
  }

  // Remove legacy fields if they exist in metadata
  delete metadata.tallas
  delete metadata.colores
  delete metadata.lensId

  return Object.keys(metadata).length > 0 ? metadata : null
}

export function buildLensAssetPayload(form: ProductFormState, producto: InventoryProduct | null): LensAssetInput | null {
  const lensId = form.lensId.trim()
  if (lensId.length === 0) {
    return null
  }

  const existingAsset = getPrimaryLensAsset(producto)
  const metadataBase =
    existingAsset?.metadata && typeof existingAsset.metadata === "object"
      ? { ...existingAsset.metadata }
      : {}
  const metadata = { ...metadataBase, lens_id: lensId }

  const payload: LensAssetInput = {
    lensId,
    provider: (existingAsset?.provider ?? "snap") || "snap",
    tipo: (existingAsset?.tipo ?? "lens") || "lens",
    metadata,
    activo: existingAsset?.activo ?? true,
  }

  if (existingAsset?.id) {
    payload.id = existingAsset.id
  }

  if (existingAsset?.url) {
    payload.url = existingAsset.url
  }

  if (existingAsset?.version) {
    payload.version = existingAsset.version
  }

  return payload
}

export function getPrimaryLensAsset(producto?: InventoryProduct | null): LensAsset | null {
  if (!producto) return null
  const assets = Array.isArray(producto.lens_assets) ? producto.lens_assets : []
  if (!assets.length) return null

  const activeAssets = assets.filter((asset) => asset && asset.activo !== false)
  if (!activeAssets.length) return null

  const findBy = (predicate: (asset: LensAsset) => boolean) =>
    activeAssets.find((asset) => {
      try {
        return predicate(asset)
      } catch {
        return false
      }
    })

  const snapLens = findBy((asset) =>
    (asset.provider ?? "").toLowerCase() === "snap" && (asset.tipo ?? "").toLowerCase() === "lens"
  )
  if (snapLens) {
    return snapLens
  }

  const genericLens = findBy((asset) => (asset.tipo ?? "").toLowerCase() === "lens")
  if (genericLens) {
    return genericLens
  }

  return activeAssets[0] ?? null
}

export function getProductLensId(producto?: InventoryProduct | null): string {
  const asset = getPrimaryLensAsset(producto)
  if (asset) {
    const metadata = asset.metadata && typeof asset.metadata === "object" ? asset.metadata : null
    if (metadata) {
      const candidates = [metadata.lens_id, metadata.lensId, metadata.id]
      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
          return candidate.trim()
        }
      }
    }

    const fromUrl = extractLensIdFromUrl(asset.url)
    if (fromUrl) {
      return fromUrl
    }
  }

  const fallback = typeof producto?.metadata?.lensId === "string" ? producto.metadata.lensId.trim() : ""
  return fallback
}

export function extractLensIdFromUrl(value?: string | null): string {
  if (!value) return ""
  const trimmed = value.trim()
  if (!trimmed) return ""

  const uuidPattern = /^[0-9a-fA-F-]{32,}$/
  if (uuidPattern.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    const paramCandidates = ["lensId", "lens_id", "id"]
    for (const key of paramCandidates) {
      const candidate = parsed.searchParams.get(key)
      if (candidate) {
        const normalized = candidate.trim()
        if (normalized && uuidPattern.test(normalized)) {
          return normalized
        }
      }
    }

    const segments = parsed.pathname.split("/").filter(Boolean)
    const lastSegment = segments[segments.length - 1]
    if (lastSegment && uuidPattern.test(lastSegment)) {
      return lastSegment
    }
  } catch {
    // noop - not a valid URL
  }

  return ""
}
