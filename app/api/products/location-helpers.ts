import type { SupabaseClient } from "@supabase/supabase-js"

export type InventoryLocationRecord = {
  id: string
  nombre: string
}

export const DEFAULT_LOCATION_NAME = "Bodega Principal"

const normalizeString = (value?: string | null) => {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : null
}

export async function fetchLocationById(
  supabase: SupabaseClient,
  id: string
): Promise<InventoryLocationRecord | null> {
  const { data, error } = await supabase
    .from("inventario_bodegas")
    .select("id, nombre")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    return null
  }

  return data ?? null
}

export async function fetchLocationByName(
  supabase: SupabaseClient,
  nombre: string
): Promise<InventoryLocationRecord | null> {
  const normalized = normalizeString(nombre)
  if (!normalized) {
    return null
  }

  const { data, error } = await supabase
    .from("inventario_bodegas")
    .select("id, nombre")
    .ilike("nombre", normalized)
    .maybeSingle()

  if (error) {
    return null
  }

  return data ?? null
}

export async function ensureLocationByName(
  supabase: SupabaseClient,
  nombre: string
): Promise<InventoryLocationRecord | null> {
  const normalized = normalizeString(nombre)
  if (!normalized) {
    return null
  }

  const existing = await fetchLocationByName(supabase, normalized)
  if (existing) {
    return existing
  }

  const { data, error } = await supabase
    .from("inventario_bodegas")
    .insert({ nombre: normalized })
    .select("id, nombre")
    .single()

  if (error) {
    return null
  }

  return data
}

export async function resolveInventoryLocation(
  supabase: SupabaseClient,
  options: { locationId?: string | null; locationName?: string | null }
): Promise<InventoryLocationRecord | null> {
  const locationId = normalizeString(options.locationId)
  const locationName = normalizeString(options.locationName)

  if (locationId) {
    const located = await fetchLocationById(supabase, locationId)
    if (located) {
      return located
    }
  }

  if (locationName) {
    const located = await ensureLocationByName(supabase, locationName)
    if (located) {
      return located
    }
  }

  return ensureLocationByName(supabase, DEFAULT_LOCATION_NAME)
}
