export type LensMetadata = {
  lensId?: string
  image_url?: string
  [key: string]: unknown
}

export type LensAsset = {
  id: string
  tipo: string
  url: string
  provider: string | null
  version: string | null
  metadata: Record<string, unknown> | null
  activo: boolean
}

export type LensProduct = {
  id: string
  nombre: string
  descripcion: string | null
  valor_unitario: number | null
  estado: string
  metadata: LensMetadata | null
  categorias?: {
    id: string
    nombre: string
  } | null
  lens_assets?: LensAsset[] | null
}

export type TryOnItemStatus = "exito" | "parcial" | "descartado" | "pendiente"

export function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value)
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
    // ignore
  }

  return ""
}

export function getPrimaryLensAsset(product?: LensProduct | null): LensAsset | null {
  if (!product) return null
  const assets = Array.isArray(product.lens_assets) ? product.lens_assets : []
  if (!assets.length) return null

  const active = assets.filter((asset) => asset && asset.activo !== false)
  if (!active.length) return null

  const snapLens = active.find(
    (asset) => (asset.provider ?? "").toLowerCase() === "snap" && (asset.tipo ?? "").toLowerCase() === "lens"
  )
  if (snapLens) {
    return snapLens
  }

  const anyLens = active.find((asset) => (asset.tipo ?? "").toLowerCase() === "lens")
  if (anyLens) {
    return anyLens
  }

  return active[0] ?? null
}

export function getLensId(product?: LensProduct | null) {
  const asset = getPrimaryLensAsset(product)
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

  const fallback = typeof product?.metadata?.lensId === "string" ? product.metadata.lensId.trim() : ""
  return fallback
}
