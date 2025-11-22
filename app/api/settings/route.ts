import { NextResponse } from "next/server"

import { ensureAdmin } from "@/lib/auth/session"
import { settingsPayloadSchema } from "@/lib/schemas/settings"
import { getSupabaseAdminClient } from "@/lib/supabase/server"
import type { SettingsPreferences, SettingsResponseData } from "@/lib/types/settings"
import type { AuthenticatedUser } from "@/lib/types/auth"

export const runtime = "nodejs"

const DEFAULT_PREFERENCES: SettingsPreferences = {
  notifications: {
    stockAlerts: true,
    weeklyReports: true,
    newTryons: false,
  },
  appearance: {
    darkMode: false,
    animations: true,
  },
  lens: {
    apiKey: null,
    renderQuality: "high",
    advancedFaceTracking: true,
  },
  security: {
    twoFactor: false,
  },
}

const normalizePreferences = (raw: unknown): { company: string | null; preferences: SettingsPreferences } => {
  const stored = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>

  const company = typeof stored.company === "string" && stored.company.trim().length > 0 ? stored.company.trim() : null

  const storedNotifications = (stored.notifications && typeof stored.notifications === "object"
    ? stored.notifications
    : {}) as Partial<SettingsPreferences["notifications"]>
  const storedAppearance = (stored.appearance && typeof stored.appearance === "object"
    ? stored.appearance
    : {}) as Partial<SettingsPreferences["appearance"]>
  const storedLens = (stored.lens && typeof stored.lens === "object"
    ? stored.lens
    : {}) as Partial<SettingsPreferences["lens"]>
  const storedSecurity = (stored.security && typeof stored.security === "object"
    ? stored.security
    : {}) as Partial<SettingsPreferences["security"]>

  const preferences: SettingsPreferences = {
    notifications: {
      stockAlerts:
        typeof storedNotifications.stockAlerts === "boolean"
          ? storedNotifications.stockAlerts
          : DEFAULT_PREFERENCES.notifications.stockAlerts,
      weeklyReports:
        typeof storedNotifications.weeklyReports === "boolean"
          ? storedNotifications.weeklyReports
          : DEFAULT_PREFERENCES.notifications.weeklyReports,
      newTryons:
        typeof storedNotifications.newTryons === "boolean"
          ? storedNotifications.newTryons
          : DEFAULT_PREFERENCES.notifications.newTryons,
    },
    appearance: {
      darkMode:
        typeof storedAppearance.darkMode === "boolean"
          ? storedAppearance.darkMode
          : DEFAULT_PREFERENCES.appearance.darkMode,
      animations:
        typeof storedAppearance.animations === "boolean"
          ? storedAppearance.animations
          : DEFAULT_PREFERENCES.appearance.animations,
    },
    lens: {
      apiKey: typeof storedLens.apiKey === "string" && storedLens.apiKey.trim() ? storedLens.apiKey.trim() : null,
      renderQuality:
        storedLens.renderQuality === "standard" || storedLens.renderQuality === "high"
          ? storedLens.renderQuality
          : DEFAULT_PREFERENCES.lens.renderQuality,
      advancedFaceTracking:
        typeof storedLens.advancedFaceTracking === "boolean"
          ? storedLens.advancedFaceTracking
          : DEFAULT_PREFERENCES.lens.advancedFaceTracking,
    },
    security: {
      twoFactor:
        typeof storedSecurity.twoFactor === "boolean"
          ? storedSecurity.twoFactor
          : DEFAULT_PREFERENCES.security.twoFactor,
    },
  }

  return { company, preferences }
}

const mergePreferences = (existing: unknown, incoming: { company: string | null } & SettingsPreferences) => {
  const base = (existing && typeof existing === "object" ? existing : {}) as Record<string, unknown>
  const baseNotifications =
    base["notifications"] && typeof base["notifications"] === "object"
      ? (base["notifications"] as Record<string, unknown>)
      : {}
  const baseAppearance =
    base["appearance"] && typeof base["appearance"] === "object"
      ? (base["appearance"] as Record<string, unknown>)
      : {}
  const baseLens =
    base["lens"] && typeof base["lens"] === "object" ? (base["lens"] as Record<string, unknown>) : {}
  const baseSecurity =
    base["security"] && typeof base["security"] === "object"
      ? (base["security"] as Record<string, unknown>)
      : {}

  return {
    ...base,
    company: incoming.company,
    notifications: {
      ...baseNotifications,
      ...incoming.notifications,
    },
    appearance: {
      ...baseAppearance,
      ...incoming.appearance,
    },
    lens: {
      ...baseLens,
      ...incoming.lens,
    },
    security: {
      ...baseSecurity,
      ...incoming.security,
    },
  }
}

const fetchMetrics = async (supabase: ReturnType<typeof getSupabaseAdminClient>) => {
  const [productsResult, categoriesResult, inventoryResult, tryOnResult, lastReportResult] = await Promise.all([
    supabase.from("prendas").select("id", { count: "exact", head: true }),
    supabase.from("categorias").select("id", { count: "exact", head: true }),
    supabase.from("inventario_items").select("cantidad, estado"),
    supabase.from("tryon_sessions").select("id", { count: "exact", head: true }),
    supabase
      .from("reportes")
      .select("created_at")
      .eq("tipo", "inventario")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (productsResult.error) {
    console.error("Error al contar productos", productsResult.error)
  }

  if (categoriesResult.error) {
    console.error("Error al contar categorías", categoriesResult.error)
  }

  if (inventoryResult.error) {
    console.error("Error al consultar inventario", inventoryResult.error)
  }

  if (tryOnResult.error) {
    console.error("Error al contar sesiones de try-on", tryOnResult.error)
  }

  if (lastReportResult.error) {
    console.error("Error al obtener el último reporte", lastReportResult.error)
  }

  const inventoryRows = Array.isArray(inventoryResult.data) ? inventoryResult.data : []

  const totalInventoryUnits = inventoryRows.reduce((total, item) => total + (item?.cantidad ?? 0), 0)
  const lowStockLocations = inventoryRows.filter((item) =>
    item?.estado === "bajo" || item?.estado === "sin_stock"
  ).length

  return {
    totalProducts: productsResult.count ?? 0,
    totalCategories: categoriesResult.count ?? 0,
    totalInventoryUnits,
    lowStockLocations,
    tryOnSessions: tryOnResult.count ?? 0,
    lastInventoryReport: lastReportResult.data?.created_at ?? null,
  }
}

const buildSettingsResponse = async (user: AuthenticatedUser): Promise<SettingsResponseData> => {
  const supabase = getSupabaseAdminClient()

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, phone, preferences, updated_at")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("Error al cargar el perfil", profileError)
  }

  const { company, preferences } = normalizePreferences(profileRow?.preferences ?? null)
  const metrics = await fetchMetrics(supabase)

  return {
    profile: {
      id: user.id,
      email: user.email,
      role: user.role === "admin" ? "admin" : "cliente",
      displayName: profileRow?.display_name ?? null,
      phone: profileRow?.phone ?? null,
      company,
      updatedAt: profileRow?.updated_at ?? null,
    },
    preferences,
    metrics,
  }
}

export async function GET() {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  try {
    const data = await buildSettingsResponse(user)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error al cargar la configuración", error)
    return NextResponse.json({ message: "No pudimos cargar la configuración" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const { user, response } = await ensureAdmin()
  if (!user) {
    return response
  }

  const payload = await request.json().catch(() => null)
  const result = settingsPayloadSchema.safeParse(payload)

  if (!result.success) {
    const errors = result.error.errors.map((issue) => issue.message)
    return NextResponse.json({ message: errors[0] ?? "Validación fallida", errors }, { status: 422 })
  }

  const supabase = getSupabaseAdminClient()
  const now = new Date().toISOString()

  try {
    const incoming = result.data
    const incomingPreferences = {
      company: incoming.company,
      notifications: incoming.notifications,
      appearance: incoming.appearance,
      lens: incoming.lens,
      security: incoming.security,
    }

    const { data: currentProfile, error: currentError } = await supabase
      .from("profiles")
      .select("id, preferences")
      .eq("id", user.id)
      .maybeSingle()

    if (currentError) {
      console.error("Error al leer el perfil actual", currentError)
      return NextResponse.json({ message: "No pudimos actualizar el perfil" }, { status: 500 })
    }

    const preferencesPayload = mergePreferences(currentProfile?.preferences ?? null, incomingPreferences)

    if (currentProfile?.id) {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: incoming.displayName,
          phone: incoming.phone,
          preferences: preferencesPayload,
          updated_at: now,
        })
        .eq("id", user.id)

      if (updateError) {
        console.error("Error al actualizar el perfil", updateError)
        return NextResponse.json({ message: "No pudimos guardar la configuración" }, { status: 500 })
      }
    } else {
      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        role: user.role === "admin" ? "admin" : "cliente",
        display_name: incoming.displayName,
        phone: incoming.phone,
        preferences: preferencesPayload,
        updated_at: now,
      })

      if (insertError) {
        console.error("Error al crear el perfil", insertError)
        return NextResponse.json({ message: "No pudimos guardar la configuración" }, { status: 500 })
      }
    }

    const data = await buildSettingsResponse(user)
    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error inesperado al actualizar la configuración", error)
    return NextResponse.json({ message: "No pudimos guardar la configuración" }, { status: 500 })
  }
}
