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
  tipo: string,
  lensId?: string
): Promise<{ id: string | null; error: PostgrestError | null }> => {
  let query = supabase
    .from("lens_assets")
    .select("id")
    .eq("prenda_id", productId)
    .eq("provider", provider)
    .eq("tipo", tipo)

  if (lensId) {
    // If we have a specific lens ID, try to find it in metadata to avoid overwriting other lenses
    // This is crucial when adding multiple new lenses at once
    query = query.eq('metadata->>lens_id', lensId)
  } else {
    // Fallback for legacy behavior or when lensId is not available
    query = query.limit(1)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    return { id: null, error }
  }

  if (data?.id) {
    return { id: data.id, error: null }
  }

  // Fallback search (only if no specific lensId was requested, or if strict search failed and we want to be loose? 
  // No, if we asked for a specific lensId and didn't find it, we should return null so a new one is created.)
  if (lensId) {
    return { id: null, error: null }
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
    const lookup = await findExistingLensAssetId(supabase, productId, provider, tipo, normalizedLensId ?? undefined)
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

export async function syncLensAssets(
  supabase: SupabaseClient,
  productId: string,
  lenses: { id?: string; lensId: string; colorCode?: string }[]
): Promise<SyncResult> {
  if (!lenses) {
    return { error: null }
  }

  // 1. Get all existing assets
  const { data: existingAssets, error: fetchError } = await supabase
    .from("lens_assets")
    .select("id")
    .eq("prenda_id", productId)
  
  if (fetchError) return { error: fetchError }

  const incomingIds = new Set(lenses.map(l => l.id).filter(Boolean))
  const toDelete = existingAssets?.filter(a => !incomingIds.has(a.id)) || []

  // 2. Delete removed assets
  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("lens_assets")
      .delete()
      .in("id", toDelete.map(a => a.id))
    
    if (deleteError) console.error("Error deleting lens assets", deleteError)
  }

  // 3. Upsert incoming assets
  for (const lens of lenses) {
    const metadata = {
      lens_id: lens.lensId,
      color_code: lens.colorCode,
      provider: DEFAULT_PROVIDER
    }

    const payload: LensAssetPayload = {
      id: lens.id,
      lensId: lens.lensId,
      provider: DEFAULT_PROVIDER,
      tipo: DEFAULT_TYPE,
      metadata,
      activo: true
    }

    const result = await syncLensAsset(supabase, productId, payload)
    if (result.error) {
      console.error("Error syncing lens:", lens.lensId, result.error)
      // Continue with others? Or fail? Let's continue but log.
    }
  }

  return { error: null }
}
