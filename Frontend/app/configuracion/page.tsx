import { User, Bell, Shield, Palette, Database, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Navbar } from "@/components/navbar"

export default function ConfiguracionPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold text-foreground mb-2">Configuración</h1>
          <p className="text-muted-foreground">Administra las preferencias de tu sistema</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Perfil de Usuario</CardTitle>
                  <CardDescription>Información básica de tu cuenta</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" placeholder="Tu nombre" defaultValue="Admin Usuario" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="tu@email.com" defaultValue="admin@tryonweb.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input id="empresa" placeholder="Nombre de tu empresa" defaultValue="TryOnWeb Inc." />
              </div>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Guardar Cambios</Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Notificaciones</CardTitle>
                  <CardDescription>Configura cómo quieres recibir alertas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Alertas de Stock Bajo</p>
                  <p className="text-sm text-muted-foreground">Recibe notificaciones cuando el stock sea crítico</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Reportes Semanales</p>
                  <p className="text-sm text-muted-foreground">Resumen semanal de métricas por email</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Nuevas Pruebas AR</p>
                  <p className="text-sm text-muted-foreground">Notificación cuando un usuario prueba un producto</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Seguridad</CardTitle>
                  <CardDescription>Protege tu cuenta y datos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Cambiar Contraseña</Label>
                <Input id="password" type="password" placeholder="Nueva contraseña" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
                <Input id="confirm-password" type="password" placeholder="Confirmar contraseña" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="font-medium text-foreground">Autenticación de Dos Factores</p>
                  <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Apariencia</CardTitle>
                  <CardDescription>Personaliza la interfaz del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Modo Oscuro</p>
                  <p className="text-sm text-muted-foreground">Cambia el tema de la interfaz</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Animaciones</p>
                  <p className="text-sm text-muted-foreground">Habilita transiciones y efectos visuales</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Lens Studio Integration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Integración Lens Studio</CardTitle>
                  <CardDescription>Configuración del módulo AR</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key de Lens Studio</Label>
                <Input id="api-key" placeholder="Ingresa tu API key" defaultValue="••••••••••••••••" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Calidad de Renderizado</p>
                  <p className="text-sm text-muted-foreground">Alta calidad consume más recursos</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Tracking Facial Avanzado</p>
                  <p className="text-sm text-muted-foreground">Mejora la precisión del posicionamiento</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Base de Datos</CardTitle>
                  <CardDescription>Gestión de datos del sistema</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Tamaño de Base de Datos</p>
                  <p className="text-sm text-muted-foreground">Espacio utilizado actualmente</p>
                </div>
                <span className="font-semibold text-foreground">2.4 GB</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Último Respaldo</p>
                  <p className="text-sm text-muted-foreground">Backup automático del sistema</p>
                </div>
                <span className="font-semibold text-foreground">Hace 2 horas</span>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline">Exportar Datos</Button>
                <Button variant="outline">Crear Respaldo</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
