"use client"

import { useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  CATEGORY_ICON_OPTIONS,
  STATUS_OPTIONS,
  type CategoryFormState,
  type IconValue,
} from "./types"

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  formState: CategoryFormState
  onFormChange: (newState: CategoryFormState | ((prev: CategoryFormState) => CategoryFormState)) => void
  onSubmit: () => void
  saving: boolean
  isEditing: boolean
}

export function CategoryDialog({
  open,
  onOpenChange,
  formState,
  onFormChange,
  onSubmit,
  saving,
  isEditing,
}: CategoryDialogProps) {
  const selectedIconOption = useMemo(
    () => CATEGORY_ICON_OPTIONS.find((option) => option.value === formState.icon) ?? null,
    [formState.icon]
  )
  const SelectedIcon = selectedIconOption?.icon ?? null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, nombre: event.target.value }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formState.descripcion}
              onChange={(event) =>
                onFormChange((prev) => ({ ...prev, descripcion: event.target.value }))
              }
              placeholder="Describe brevemente esta categoría"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={formState.estado}
                onValueChange={(value: "activa" | "inactiva") =>
                  onFormChange((prev) => ({ ...prev, estado: value }))
                }
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
              <Label>Icono</Label>
              <Select
                value={formState.icon}
                onValueChange={(value: IconValue) =>
                  onFormChange((prev) => ({ ...prev, icon: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un icono" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ICON_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Vista previa:
                {SelectedIcon ? (
                  <>
                    <SelectedIcon className="h-4 w-4" />
                    <span>{selectedIconOption?.label}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground/80">
                    Selecciona un icono para esta categoría
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
