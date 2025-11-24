"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import { useToast } from "@/hooks/use-toast"
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from "@/lib/services/categories"

import { CategoryDialog } from "@/components/categories/category-dialog"
import {
  CATEGORY_ICON_MAP,
  getInitialCategoryForm,
  type CategoryFormState,
  type IconValue,
} from "@/components/categories/types"

export default function CategoriasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formState, setFormState] = useState<CategoryFormState>(getInitialCategoryForm())
  const [saving, setSaving] = useState(false)

  const isEditing = useMemo(() => formState.id !== null, [formState.id])

  const loadCategories = useCallback(async () => {
    setLoading(true)
    try {
      const data = await listCategories()
      setCategorias(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos cargar las categorías"
      if (message === "No autorizado" || message === "Permisos insuficientes") {
        router.replace("/")
        return
      }
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast, router])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleOpenDialog = () => {
    setFormState(getInitialCategoryForm())
    setDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setFormState({
      id: category.id,
      nombre: category.nombre,
      descripcion: category.descripcion ?? "",
      estado: category.estado,
      icon:
        category.icon && CATEGORY_ICON_MAP[category.icon as IconValue]
          ? (category.icon as IconValue)
          : "",
    })
    setDialogOpen(true)
  }

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setFormState(getInitialCategoryForm())
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
    const icon = formState.icon
    const payload = {
      nombre: formState.nombre,
      descripcion: descripcion.length > 0 ? descripcion : undefined,
      estado: formState.estado,
      icon: icon && icon.length > 0 ? icon : undefined,
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

      <main className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Gestión de Categorías</p>
            </div>
            <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Categorías</h1>
            <p className="text-lg text-muted-foreground">Organiza tus productos por categorías</p>
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
            {categorias.map((categoria) => {
              const isActive = categoria.estado === "activa"
              const IconComponent = categoria.icon
                ? CATEGORY_ICON_MAP[categoria.icon as IconValue]
                : undefined

              return (
                <Card key={categoria.id} className="hover:shadow-lg transition-all group flex flex-col h-full">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white text-xl backdrop-blur-sm shadow-inner"
                        style={{
                          background: "linear-gradient(135deg, rgba(32, 163, 169, 0.65), rgba(13, 110, 123, 0.35))",
                          border: "1px solid rgba(255, 255, 255, 0.25)",
                          boxShadow: "0 10px 25px rgba(13, 110, 123, 0.15)",
                        }}
                      >
                        {IconComponent ? <IconComponent className="h-6 w-6" /> : <Package className="h-6 w-6" />}
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
                      <p className="text-muted-foreground mb-4 text-sm line-clamp-2">{categoria.descripcion}</p>
                    )}

                    <p className="text-sm text-muted-foreground mb-6">
                      {categoria.productCount} producto{categoria.productCount === 1 ? "" : "s"}
                    </p>

                    <div className="mt-auto pt-4 border-t border-border">
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

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        formState={formState}
        onFormChange={setFormState}
        onSubmit={handleSubmit}
        saving={saving}
        isEditing={isEditing}
      />
    </div>
  )
}
