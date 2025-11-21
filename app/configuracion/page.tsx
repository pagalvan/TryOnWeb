"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Database, Eye, EyeOff, Palette, Shield, User, Zap } from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Spinner } from "@/components/ui/spinner"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import type { SettingsMetrics, SettingsResponseData } from "@/lib/types/settings"

type SettingsFormState = {
  displayName: string
  phone: string
  company: string
  notifications: {
    stockAlerts: boolean
    weeklyReports: boolean
    newTryons: boolean
  }
  appearance: {
    darkMode: boolean
    animations: boolean
  }
  lens: {
    apiKey: string
    renderQuality: "standard" | "high"
    advancedFaceTracking: boolean
  }
  security: {
    twoFactor: boolean
  }
}

type PasswordFormState = {
  newPassword: string
  confirmPassword: string
}

const numberFormatter = new Intl.NumberFormat("es-CO")

const formatDateTime = (value: string | null) => {
  if (!value) return "Sin registros"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin registros"
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}

const formatInventoryUnits = (units: number) => {
  if (!Number.isFinite(units)) return "0"
  return numberFormatter.format(Math.max(0, Math.round(units)))
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [form, setForm] = useState<SettingsFormState | null>(null)
  const [metrics, setMetrics] = useState<SettingsMetrics | null>(null)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lensKeyVisible, setLensKeyVisible] = useState(false)
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({ newPassword: "", confirmPassword: "" })
  const [changingPassword, setChangingPassword] = useState(false)

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
        router.replace("/login")
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

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Completa la información",
        description: "Ingresa y confirma la nueva contraseña",
        variant: "destructive",
      })
      return
    }

    setChangingPassword(true)
    try {
      await apiFetch("/api/settings/password", {
        method: "POST",
        body: JSON.stringify(passwordForm),
      })

      toast({ title: "Contraseña actualizada" })
      setPasswordForm({ newPassword: "", confirmPassword: "" })
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos actualizar la contraseña"
      toast({
        title: "Error al actualizar",
        description: message,
        variant: "destructive",
      })
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Administra las preferencias de tu cuenta y del módulo AR</p>
          </div>
          <Button onClick={handleSave} disabled={saving || !form} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4" /> Guardando
              </span>
            ) : (
              "Guardar configuración"
            )}
          </Button>
        </div>

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
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Perfil de usuario</CardTitle>
                    <CardDescription>Datos que usaremos en reportes y notificaciones</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nombre</Label>
                    <Input
                      id="displayName"
                      value={form.displayName}
                      onChange={(event) =>
                        setForm((current) => (current ? { ...current, displayName: event.target.value } : current))
                      }
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled className="bg-muted text-muted-foreground" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono de contacto</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(event) =>
                        setForm((current) => (current ? { ...current, phone: event.target.value } : current))
                      }
                      placeholder="Tu número de contacto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                      id="company"
                      value={form.company}
                      onChange={(event) =>
                        setForm((current) => (current ? { ...current, company: event.target.value } : current))
                      }
                      placeholder="Nombre de la empresa"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Los ajustes de notificaciones, apariencia y Lens Studio se guardarán junto con tus datos de perfil.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Notificaciones</CardTitle>
                    <CardDescription>Define qué alertas enviaremos al equipo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Alertas de stock crítico</p>
                    <p className="text-sm text-muted-foreground">Enviamos un correo cuando la bodega llegue al mínimo configurado.</p>
                  </div>
                  <Switch
                    checked={form.notifications.stockAlerts}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              notifications: { ...current.notifications, stockAlerts: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Resumen semanal</p>
                    <p className="text-sm text-muted-foreground">Incluye métricas clave de inventario y sesiones del probador virtual.</p>
                  </div>
                  <Switch
                    checked={form.notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              notifications: { ...current.notifications, weeklyReports: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Nuevos intentos AR</p>
                    <p className="text-sm text-muted-foreground">Recibe una alerta cuando un cliente use el probador virtual.</p>
                  </div>
                  <Switch
                    checked={form.notifications.newTryons}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              notifications: { ...current.notifications, newTryons: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apariencia</CardTitle>
                    <CardDescription>Sincronizamos el tema con tus preferencias</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Modo oscuro</p>
                    <p className="text-sm text-muted-foreground">Aplicamos el tema oscuro en toda la plataforma.</p>
                  </div>
                  <Switch
                    checked={form.appearance.darkMode}
                    onCheckedChange={(checked) =>
                      setForm((current) => {
                        if (!current) return current
                        applyThemePreference(checked)
                        return { ...current, appearance: { ...current.appearance, darkMode: checked } }
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Animaciones</p>
                    <p className="text-sm text-muted-foreground">Suaviza las transiciones de dashboards y listados.</p>
                  </div>
                  <Switch
                    checked={form.appearance.animations}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              appearance: { ...current.appearance, animations: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Integración Lens Studio</CardTitle>
                    <CardDescription>Configura la conexión con tus lentes y modelos 3D</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lensKey">API key de Lens Studio</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="lensKey"
                      value={form.lens.apiKey}
                      onChange={(event) =>
                        setForm((current) =>
                          current
                            ? {
                                ...current,
                                lens: { ...current.lens, apiKey: event.target.value },
                              }
                            : current
                        )
                      }
                      type={lensKeyVisible ? "text" : "password"}
                      placeholder="Ingresa tu API key"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLensKeyVisible((previous) => !previous)}
                      className="px-3"
                    >
                      {lensKeyVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Guardamos esta clave asociada a tu perfil en Supabase. Si cambias el valor, reemplazaremos la clave actual.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Calidad de renderizado</p>
                    <p className="text-sm text-muted-foreground">Activa la calidad alta para catálogos premium.</p>
                  </div>
                  <Switch
                    checked={form.lens.renderQuality === "high"}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              lens: { ...current.lens, renderQuality: checked ? "high" : "standard" },
                            }
                          : current
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Tracking facial avanzado</p>
                    <p className="text-sm text-muted-foreground">Mejora el anclaje de los lentes en dispositivos compatibles.</p>
                  </div>
                  <Switch
                    checked={form.lens.advancedFaceTracking}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              lens: { ...current.lens, advancedFaceTracking: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Seguridad</CardTitle>
                    <CardDescription>Actualiza tu contraseña y preferencias de acceso</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="grid gap-4 md:grid-cols-2" onSubmit={handlePasswordSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nueva contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Usa una contraseña de al menos 8 caracteres. Esta acción actualiza tu usuario en Supabase.
                    </div>
                    <Button type="submit" disabled={changingPassword} variant="outline">
                      {changingPassword ? (
                        <span className="flex items-center gap-2">
                          <Spinner className="h-4 w-4" /> Guardando
                        </span>
                      ) : (
                        "Actualizar contraseña"
                      )}
                    </Button>
                  </div>
                </form>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Autenticación de dos factores</p>
                    <p className="text-sm text-muted-foreground">
                      Habilita el registro de dispositivos confiables y notificaciones de acceso.
                    </p>
                  </div>
                  <Switch
                    checked={form.security.twoFactor}
                    onCheckedChange={(checked) =>
                      setForm((current) =>
                        current
                          ? {
                              ...current,
                              security: { ...current.security, twoFactor: checked },
                            }
                          : current
                      )
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Próximamente enviaremos códigos de respaldo cuando actives esta opción.
                </p>
              </CardContent>
            </Card>

            {metrics && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Salud de datos</CardTitle>
                      <CardDescription>Resumen generado con información real del inventario</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Productos en catálogo</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(metrics.totalProducts)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Categorías registradas</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(metrics.totalCategories)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Unidades en inventario</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {formatInventoryUnits(metrics.totalInventoryUnits)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Alertas de stock activas</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(metrics.lowStockLocations)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Sesiones de probador virtual</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {numberFormatter.format(metrics.tryOnSessions)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Último reporte de inventario</p>
                    <p className="mt-1 text-lg font-medium text-foreground">{formatDateTime(metrics.lastInventoryReport)}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      <Toaster />
    </div>
  )
}
