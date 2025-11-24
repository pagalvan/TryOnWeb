"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import type { SettingsMetrics, SettingsResponseData } from "@/lib/types/settings"

import { ProfileCard } from "@/components/settings/profile-card"
import { NotificationsCard } from "@/components/settings/notifications-card"
import { AppearanceCard } from "@/components/settings/appearance-card"
import { LensCard } from "@/components/settings/lens-card"
import { SecurityCard } from "@/components/settings/security-card"
import { MetricsCard } from "@/components/settings/metrics-card"
import { type SettingsFormState, type PasswordFormState } from "@/components/settings/types"

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState<SettingsFormState | null>(null)
  const [metrics, setMetrics] = useState<SettingsMetrics | null>(null)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const applyThemePreference = useCallback((isDark: boolean) => {
    if (typeof window === "undefined") return
    const root = window.document.documentElement
    root.classList.toggle("dark", isDark)
    window.localStorage.setItem("tryon-theme", isDark ? "dark" : "light")
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedTheme = window.localStorage.getItem("tryon-theme")
    if (storedTheme === "dark" || storedTheme === "light") {
      window.document.documentElement.classList.toggle("dark", storedTheme === "dark")
    }
  }, [])

  const mapResponseToState = useCallback((data: SettingsResponseData) => {
    setForm({
      displayName: data.profile.displayName ?? "",
      phone: data.profile.phone ?? "",
      company: data.profile.company ?? "",
      notifications: data.preferences.notifications,
      appearance: data.preferences.appearance,
      lens: {
        apiKey: data.preferences.lens.apiKey ?? "",
        renderQuality: data.preferences.lens.renderQuality,
        advancedFaceTracking: data.preferences.lens.advancedFaceTracking,
      },
      security: data.preferences.security,
    })
    setEmail(data.profile.email)
    setMetrics(data.metrics)
    applyThemePreference(data.preferences.appearance.darkMode)
  }, [applyThemePreference])

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const response = await apiFetch<{ data: SettingsResponseData }>("/api/settings")
      mapResponseToState(response.data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos cargar la configuración"
      if (message === "No autorizado" || message === "Permisos insuficientes") {
        router.replace("/")
        return
      }
      setLoadError(message)
    } finally {
      setLoading(false)
    }
  }, [mapResponseToState, router])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    try {
      const trimmedPhone = form.phone.trim()
      const trimmedCompany = form.company.trim()
      const trimmedLensKey = form.lens.apiKey.trim()

      const payload = {
        displayName: form.displayName.trim(),
        phone: trimmedPhone,
        company: trimmedCompany,
        notifications: form.notifications,
        appearance: form.appearance,
        lens: {
          ...form.lens,
          apiKey: trimmedLensKey,
        },
        security: form.security,
      }

      const response = await apiFetch<{ data: SettingsResponseData }>("/api/settings", {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      mapResponseToState(response.data)
      toast({ title: "Configuración guardada", description: "Actualizamos tus preferencias con éxito." })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos guardar la configuración"
      toast({
        title: "Error al guardar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (passwordForm: PasswordFormState) => {
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Completa la información",
        description: "Ingresa y confirma la nueva contraseña",
        variant: "destructive",
      })
      return
    }

    await apiFetch("/api/settings/password", {
      method: "POST",
      body: JSON.stringify(passwordForm),
    })

    toast({ title: "Contraseña actualizada" })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-1 w-8 bg-primary rounded-full" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Preferencias</p>
              </div>
              <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Configuración</h1>
              <p className="text-lg text-muted-foreground">Administra las preferencias de tu cuenta y del módulo AR</p>
            </div>
          </div>

          <div>
            {loading && !form && (
              <div className="flex justify-center py-20">
                <Spinner className="h-6 w-6" />
              </div>
            )}

            {loadError && (
              <Card className="mb-6 border-destructive/40">
                <CardContent className="py-6 text-center text-destructive">{loadError}</CardContent>
              </Card>
            )}

            {form && (
              <div className="space-y-6">
                <ProfileCard form={form} email={email} onChange={setForm} />
                <NotificationsCard form={form} onChange={setForm} />
                <AppearanceCard form={form} onChange={setForm} onThemeChange={applyThemePreference} />
                <LensCard form={form} onChange={setForm} />
                <SecurityCard form={form} onChange={setForm} onPasswordSubmit={handlePasswordSubmit} />
                {metrics && <MetricsCard metrics={metrics} />}

                <div className="flex justify-center pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={saving || !form}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 w-full md:w-auto md:min-w-[200px]"
                  >
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" /> Guardando
                      </span>
                    ) : (
                      "Guardar configuración"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
