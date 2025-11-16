"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Plus,
  MoreVertical,
  Package,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/services/categories"

type CategoryFormState = {
  id: string | null
  nombre: string
  descripcion: string
  estado: "activa" | "inactiva"
  icon: string
}

const STATUS_OPTIONS = [
  { value: "activa", label: "Activa" },
  { value: "inactiva", label: "Inactiva" },
]

const COLOR_CLASSES = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-teal-500",
]

const emptyFormState = (): CategoryFormState => ({
  id: null,
  nombre: "",
  descripcion: "",
  estado: "activa",
  icon: "",
})

export default function CategoriasPage() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formState, setFormState] = useState<CategoryFormState>(emptyFormState)
  const [saving, setSaving] = useState(false)

  const isEditing = useMemo(() => formState.id !== null, [formState.id])

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCategories()
      setCategorias(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos cargar las categorías"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleOpenDialog = () => {
    setFormState(emptyFormState())
    setDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setFormState({
      id: category.id,
      nombre: category.nombre,
      descripcion: category.descripcion ?? "",
      estado: category.estado,
      icon: category.icon ?? "",
    })
    setDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setFormState(emptyFormState())
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!formState.nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    setSaving(true)
    const descripcion = formState.descripcion.trim()
    const icon = formState.icon.trim()
    const payload = {
      nombre: formState.nombre,
      descripcion: descripcion.length > 0 ? descripcion : undefined,
      estado: formState.estado,
      icon: icon.length > 0 ? icon : undefined,
    }

    try {
      if (isEditing && formState.id) {
        await updateCategory(formState.id, payload)
        toast({ title: "Categoría actualizada" })
      } else {
        await createCategory(payload)
        toast({ title: "Categoría creada" })
      }

      handleDialogChange(false)
      await loadCategories()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos guardar la categoría"
      toast({ title: "Error", description: message, variant: "destructive" })
      setSaving(false)
    }
  }

  const handleDelete = async (category: Category) => {
    if (!confirm(`¿Eliminar la categoría "${category.nombre}"?`)) return
    try {
      await deleteCategory(category.id)
      toast({ title: "Categoría eliminada" })
      await loadCategories()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos eliminar la categoría"
      toast({ title: "Error", description: message, variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-foreground mb-2">Categorías</h1>
            <p className="text-muted-foreground">Organiza tus productos por categorías</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleOpenDialog}>
            <Plus className="mr-2 h-5 w-5" />
            Nueva Categoría
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Cargando categorías...
          </div>
        ) : categorias.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay categorías registradas</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-md">
                Crea una categoría para comenzar a organizar tu catálogo.
              </p>
              <Button onClick={handleOpenDialog}>
                <Plus className="mr-2 h-5 w-5" /> Nueva Categoría
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categorias.map((categoria, index) => {
              const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length]
              const isActive = categoria.estado === "activa"

              return (
                <Card key={categoria.id} className="hover:shadow-lg transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-12 w-12 rounded-xl ${colorClass} flex items-center justify-center text-white text-xl`}>
                        {categoria.icon ? categoria.icon : <Package className="h-6 w-6" />}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCategory(categoria)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDelete(categoria)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {categoria.nombre}
                      </h3>
                      <Badge variant={isActive ? "outline" : "destructive"} className="capitalize">
                        {isActive ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Activa
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Inactiva
                          </span>
                        )}
                      </Badge>
                    </div>

                    {categoria.descripcion && (
                      <p className="text-muted-foreground mb-4 text-sm">{categoria.descripcion}</p>
                    )}

                    <p className="text-sm text-muted-foreground mb-6">
                      {categoria.productCount} producto{categoria.productCount === 1 ? "" : "s"}
                    </p>

                    <div className="pt-4 border-t border-border">
                      <Link href={`/categorias/${categoria.id}`}>
                        <Button variant="outline" className="w-full bg-transparent">
                          Ver productos
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                value={formState.nombre}
                onChange={(event) => setFormState((prev) => ({ ...prev, nombre: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formState.descripcion}
                onChange={(event) => setFormState((prev) => ({ ...prev, descripcion: event.target.value }))}
                placeholder="Describe brevemente esta categoría"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select
                  value={formState.estado}
                  onValueChange={(value: "activa" | "inactiva") => setFormState((prev) => ({ ...prev, estado: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icono">Icono (emoji o texto corto)</Label>
                <Input
                  id="icono"
                  maxLength={4}
                  value={formState.icon}
                  onChange={(event) => setFormState((prev) => ({ ...prev, icon: event.target.value }))}
                  placeholder="Ej: 🎯"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
