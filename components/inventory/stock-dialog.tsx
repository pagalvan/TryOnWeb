"use client"

import { type ChangeEvent } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { InventoryLocation, InventoryProduct } from "@/lib/services/inventory"
import { INVENTORY_STATUS_OPTIONS, type StockFormState } from "./types"

type StockDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: InventoryProduct | null
  locations: InventoryLocation[]
  stockForm: StockFormState
  onFormChange: (value: StockFormState) => void
  onSubmit: () => void
  onDelete: () => void
  saving: boolean
  onRequestNewLocation: () => void
}

export function StockDialog({
  open,
  onOpenChange,
  product,
  locations,
  stockForm,
  onFormChange,
  onSubmit,
  onDelete,
  saving,
  onRequestNewLocation,
}: StockDialogProps) {
  if (!product) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>Selecciona un producto</DialogContent>
      </Dialog>
    )
  }

  const handleChange = (field: keyof StockFormState, value: string) => {
    onFormChange({ ...stockForm, [field]: value })
  }

  const handleInputChange = (field: keyof StockFormState) => (event: ChangeEvent<HTMLInputElement>) => {
    handleChange(field, event.target.value)
  }

  const existingItems = product.inventario_items || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Inventario de {product.nombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {existingItems.length > 0 && (
            <div className="border border-border rounded-lg divide-y divide-border">
              {existingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full text-left p-4 flex items-center justify-between ${
                    stockForm.itemId === item.id ? "bg-muted/50" : "bg-card"
                  }`}
                  onClick={() =>
                    onFormChange({
                      ...stockForm,
                      itemId: item.id,
                      bodegaId: item.bodega?.id ?? item.bodega_id ?? stockForm.bodegaId,
                      cantidad: item.cantidad?.toString() ?? "0",
                      cantidadMinima: item.cantidad_minima?.toString() ?? "0",
                      estado: item.estado ?? "ok",
                    })
                  }
                >
                  <div>
                    <p className="font-medium">{item.bodega?.nombre ?? item.ubicacion}</p>
                    <p className="text-sm text-muted-foreground">{item.cantidad} unidades</p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {item.estado ?? "ok"}
                  </Badge>
                </button>
              ))}
            </div>
          )}

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Bodega</Label>
              {locations.length > 0 ? (
                <>
                  <Select value={stockForm.bodegaId} onValueChange={(value: string) => handleChange("bodegaId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una bodega" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" className="justify-start px-0 text-sm gap-2" onClick={onRequestNewLocation}>
                    <Plus className="h-4 w-4" />
                    Crear bodega
                  </Button>
                </>
              ) : (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground space-y-2">
                  <p>No hay bodegas registradas. Crea una para asignar el stock.</p>
                  <Button size="sm" onClick={onRequestNewLocation} className="gap-2">
                    <Plus className="h-4 w-4" /> Crear bodega
                  </Button>
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Cantidad</Label>
              <Input type="number" min="0" value={stockForm.cantidad} onChange={handleInputChange("cantidad")} />
            </div>
            <div className="grid gap-2">
              <Label>Cantidad mínima</Label>
              <Input type="number" min="0" value={stockForm.cantidadMinima} onChange={handleInputChange("cantidadMinima")} />
            </div>
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={stockForm.estado} onValueChange={(value: string) => handleChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-1 items-center justify-between gap-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <div className="flex gap-2">
              {stockForm.itemId && (
                <Button variant="destructive" onClick={onDelete}>
                  Eliminar registro
                </Button>
              )}
              <Button onClick={onSubmit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
