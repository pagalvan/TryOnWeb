import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js"

type LensAssetPayload = {
  id?: string | null
  lensId?: string | null
  provider?: string | null
  tipo?: string | null
  url?: string | null
  version?: string | null
  metadata?: Record<string, unknown> | null
  activo?: boolean | null
}

type SyncResult = {
  error: PostgrestError | null
}

const DEFAULT_PROVIDER = "snap"
const DEFAULT_TYPE = "lens"
const ALLOWED_TYPES = new Set(["glb", "lens", "image", "video", "anchor"])

const UUID_PATTERN = /^[0-9a-fA-F-]{32,}$/

const sanitizeString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

const buildLensUrl = (provider: string, lensId: string) => {
  if (provider === DEFAULT_PROVIDER) {
    return `https://www.snapchat.com/unlock/?lensId=${lensId}`
  }
  return lensId
}

const mergeMetadata = (
  metadata: Record<string, unknown> | null | undefined,
  lensId: string,
  provider: string
): Record<string, unknown> => {
  const base = metadata && typeof metadata === "object" ? { ...metadata } : {}
  base.lens_id = lensId
  if (!base.provider) {
    base.provider = provider
  }
  return base
}

const findExistingLensAssetId = async (
  supabase: SupabaseClient,
  productId: string,
  provider: string,
  tipo: string
): Promise<{ id: string | null; error: PostgrestError | null }> => {
  const { data, error } = await supabase
    .from("lens_assets")
    .select("id")
    .eq("prenda_id", productId)
    .eq("provider", provider)
    .eq("tipo", tipo)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    return { id: null, error }
  }

  if (data?.id) {
    return { id: data.id, error: null }
  }

  const fallback = await supabase
    .from("lens_assets")
    .select("id")
    .eq("prenda_id", productId)
    .eq("tipo", tipo)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fallback.error) {
    return { id: null, error: fallback.error }
  }

  return { id: fallback.data?.id ?? null, error: null }
}

export async function syncLensAsset(
  supabase: SupabaseClient,
  productId: string,
  input: LensAssetPayload | null | undefined
): Promise<SyncResult> {
  if (input === undefined) {
    return { error: null }
  }

  const provider = (sanitizeString(input?.provider) ?? DEFAULT_PROVIDER).toLowerCase()
  let tipo = (sanitizeString(input?.tipo) ?? DEFAULT_TYPE).toLowerCase()
  if (!ALLOWED_TYPES.has(tipo)) {
    tipo = DEFAULT_TYPE
  }
  const lensIdValue = sanitizeString(input?.lensId)

  if (!lensIdValue) {
    const { error } = await supabase
      .from("lens_assets")
      .delete()
      .eq("prenda_id", productId)
      .eq("tipo", tipo)
    return { error }
  }

  const normalizedLensId = UUID_PATTERN.test(lensIdValue) ? lensIdValue : lensIdValue
  const metadata = mergeMetadata(input?.metadata ?? null, normalizedLensId, provider)
  const url = sanitizeString(input?.url) ?? buildLensUrl(provider, normalizedLensId)
  const activo = input?.activo ?? true
  const version = sanitizeString(input?.version)
  const now = new Date().toISOString()

  let targetId = sanitizeString(input?.id)
  if (!targetId) {
    const lookup = await findExistingLensAssetId(supabase, productId, provider, tipo)
    if (lookup.error) {
      return { error: lookup.error }
    }
    targetId = lookup.id
  }

  if (targetId) {
    const { error } = await supabase
      .from("lens_assets")
      .update({
        url,
        provider,
        tipo,
        version,
        metadata,
        activo,
        updated_at: now,
      })
      .eq("id", targetId)

    return { error }
  }

  const { error } = await supabase.from("lens_assets").insert({
    prenda_id: productId,
    tipo,
    url,
    provider,
    version,
    metadata,
    activo,
    updated_at: now,
  })

  return { error }
}
