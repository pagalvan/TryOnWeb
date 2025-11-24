"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createInventoryLocation, type InventoryLocation } from "@/lib/services/inventory"

type LocationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (location: InventoryLocation) => void
}

type LocationFormState = {
  nombre: string
  descripcion: string
  direccion: string
  ciudad: string
}

export function LocationDialog({ open, onOpenChange, onCreated }: LocationDialogProps) {
  const { toast } = useToast()
  const [form, setForm] = useState<LocationFormState>({
    nombre: "",
    descripcion: "",
    direccion: "",
    ciudad: "",
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setForm({
        nombre: "",
        descripcion: "",
        direccion: "",
        ciudad: "",
      })
      setSaving(false)
    }
  }, [open])

  const handleInputChange =
    (field: keyof LocationFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async () => {
    if (!form.nombre.trim()) {
      toast({ title: "El nombre es obligatorio", variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      const location = await createInventoryLocation({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() ? form.descripcion.trim() : null,
        direccion: form.direccion.trim() ? form.direccion.trim() : null,
        ciudad: form.ciudad.trim() ? form.ciudad.trim() : null,
      })
      if (!location) {
        throw new Error("No pudimos crear la bodega")
      }
      toast({ title: "Bodega creada", description: "Ya puedes asignarla al inventario." })
      onCreated(location)
      onOpenChange(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pudimos crear la bodega"
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva bodega</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre-bodega">Nombre</Label>
            <Input id="nombre-bodega" value={form.nombre} onChange={handleInputChange("nombre")} autoFocus />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="descripcion-bodega">Descripción</Label>
            <Textarea id="descripcion-bodega" value={form.descripcion} onChange={handleInputChange("descripcion")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="direccion-bodega">Dirección</Label>
            <Input id="direccion-bodega" value={form.direccion} onChange={handleInputChange("direccion")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ciudad-bodega">Ciudad</Label>
            <Input id="ciudad-bodega" value={form.ciudad} onChange={handleInputChange("ciudad")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Crear bodega"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
