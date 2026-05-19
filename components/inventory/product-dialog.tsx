"use client"

import { useState, useMemo, useRef, type ChangeEvent } from "react"
import { Plus, Wand2, X, Upload, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { InventoryCategory, InventoryLocation } from "@/lib/services/inventory"
import { PRODUCT_STATUS_OPTIONS, type ProductFormState } from "./types"

type ProductDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categorias: InventoryCategory[]
  locations: InventoryLocation[]
  productForm: ProductFormState
  onFormChange: (value: ProductFormState) => void
  onSubmit: () => void
  saving: boolean
  isEditing: boolean
  onRequestNewLocation: () => void
}

export function ProductDialog({
  open,
  onOpenChange,
  categorias,
  locations,
  productForm,
  onFormChange,
  onSubmit,
  saving,
  isEditing,
  onRequestNewLocation,
}: ProductDialogProps) {
  const [colorCode, setColorCode] = useState("#000000")
  const [tallaInput, setTallaInput] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (field: keyof ProductFormState, value: any) => {
    onFormChange({ ...productForm, [field]: value })
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Error al subir la imagen")
      }

      const data = await response.json()
      handleChange("imageUrl", data.url)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Error al subir la imagen')
    } finally {
      setUploading(false)
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleInputChange =
    (field: keyof ProductFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      handleChange(field, event.target.value)
    }

  const parsedColors = useMemo(() => {
    if (!productForm.colores) return []
    return productForm.colores.split(",").map((c) => {
      const parts = c.split(":")
      const name = parts[0]?.trim()
      const code = parts[1]?.trim() || name
      return { name, code }
    }).filter((c) => c.name)
  }, [productForm.colores])

  const parsedTallas = useMemo(() => {
    if (!productForm.tallas) return []
    return productForm.tallas.split(",").map(t => t.trim()).filter(t => t.length > 0)
  }, [productForm.tallas])

  const handleAddColor = () => {
    if (!colorCode.trim()) return
    // Use code as name since we removed the name input
    const code = colorCode.trim().toUpperCase()
    const newEntry = `${code}:${code}`
    const currentList = parsedColors.map(c => `${c.name}:${c.code}`)
    currentList.push(newEntry)
    handleChange("colores", currentList.join(","))
    setColorCode("#000000")
  }

  const handleRemoveColor = (index: number) => {
    const newColors = parsedColors.filter((_, i) => i !== index)
    handleChange("colores", newColors.map((c) => `${c.name}:${c.code}`).join(","))
  }

  const handleAddTalla = () => {
    if (!tallaInput.trim()) return
    const talla = tallaInput.trim().toUpperCase()
    const currentList = [...parsedTallas, talla]
    handleChange("tallas", currentList.join(","))
    setTallaInput("")
  }

  const handleRemoveTalla = (index: number) => {
    const newTallas = parsedTallas.filter((_, i) => i !== index)
    handleChange("tallas", newTallas.join(","))
  }

  // Inventory Handlers
  const handleAddInventoryRow = () => {
    const current = productForm.inventory || []
    handleChange("inventory", [...current, { locationId: locations[0]?.id || "", quantity: 0 }])
  }

  const handleRemoveInventoryRow = (index: number) => {
    const current = productForm.inventory || []
    handleChange("inventory", current.filter((_, i) => i !== index))
  }

  const handleInventoryChange = (index: number, field: "locationId" | "quantity", value: string | number) => {
    const current = [...(productForm.inventory || [])]
    if (current[index]) {
      current[index] = { ...current[index], [field]: value }
      handleChange("inventory", current)
    }
  }

  // Lens Handlers
  const handleAddLensRow = () => {
    const current = productForm.lenses || []
    handleChange("lenses", [...current, { lensId: "", colorCode: "" }])
  }

  const handleRemoveLensRow = (index: number) => {
    const current = productForm.lenses || []
    handleChange("lenses", current.filter((_, i) => i !== index))
  }

  const handleLensChange = (index: number, field: "lensId" | "colorCode", value: string) => {
    const current = [...(productForm.lenses || [])]
    if (current[index]) {
      current[index] = { ...current[index], [field]: value }
      handleChange("lenses", current)
    }
  }

  const canAddStock = !isEditing && locations.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar producto" : "Nuevo producto"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" value={productForm.nombre} onChange={handleInputChange("nombre")} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <div className="flex gap-2">
                <Input id="sku" value={productForm.sku} onChange={handleInputChange("sku")} placeholder="Código único" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const cat = categorias.find((c) => c.id === productForm.categoriaId)
                    const catPrefix = (cat?.nombre || "GEN").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "X")
                    const namePrefix = (productForm.nombre || "PRO").substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, "X")
                    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
                    const newSku = `${catPrefix}-${namePrefix}-${random}`
                    handleChange("sku", newSku)
                  }}
                  title="Generar SKU automático"
                >
                  <Wand2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Categoría</Label>
              <Select value={productForm.categoriaId} onValueChange={(value: string) => handleChange("categoriaId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Precio</Label>
              <Input type="number" min="0" step="0.01" value={productForm.precio} onChange={handleInputChange("precio")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Descripción</Label>
            <Textarea value={productForm.descripcion} onChange={handleInputChange("descripcion")} className="h-20 resize-none" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tallas</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Ej: S, M, L" 
                  value={tallaInput} 
                  onChange={(e) => setTallaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTalla()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTalla} size="icon" variant="outline" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {parsedTallas.length === 0 && (
                  <span className="text-xs text-muted-foreground italic py-1">Sin tallas asignadas</span>
                )}
                {parsedTallas.map((t, i) => (
                  <Badge key={i} variant="secondary" className="gap-2 pl-2 pr-1 py-1 h-7">
                    <span>{t}</span>
                    <button 
                      onClick={() => handleRemoveTalla(i)} 
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Colores</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Input 
                    placeholder="#000000" 
                    value={colorCode} 
                    onChange={(e) => setColorCode(e.target.value)}
                    className="font-mono"
                    maxLength={7}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        handleAddColor()
                      }
                    }}
                  />
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border shadow-sm">
                    <div 
                      className="absolute inset-0" 
                      style={{ backgroundColor: colorCode }} 
                    />
                    <input 
                      type="color" 
                      value={colorCode.length === 7 ? colorCode : "#000000"} 
                      onChange={(e) => setColorCode(e.target.value)} 
                      className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer opacity-0" 
                    />
                  </div>
                  <Button type="button" onClick={handleAddColor} size="icon" variant="outline" className="shrink-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[2rem]">
                {parsedColors.length === 0 && (
                  <span className="text-xs text-muted-foreground italic py-1">Sin colores asignados</span>
                )}
                {parsedColors.map((c, i) => (
                  <Badge key={i} variant="secondary" className="gap-2 pl-1 pr-2 py-1 h-7">
                    <div 
                      className="h-4 w-4 rounded-full border border-border shadow-sm" 
                      style={{ backgroundColor: c.code }} 
                      title={c.code}
                    />
                    <span>{c.code}</span>
                    <button 
                      onClick={() => handleRemoveColor(i)} 
                      className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <Select value={productForm.estado} onValueChange={(value: string) => handleChange("estado", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border border-border rounded-lg px-4 py-2">
              <div>
                <Label className="text-sm font-medium">Destacado</Label>
                <p className="text-[10px] text-muted-foreground">Aparece primero en la lista</p>
              </div>
              <Switch checked={productForm.destacado} onCheckedChange={(checked: boolean) => handleChange("destacado", checked)} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Imagen (URL)</Label>
              <div className="flex gap-2">
                <Input placeholder="https://..." value={productForm.imageUrl} onChange={handleInputChange("imageUrl")} />
                <Input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Subir imagen"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Lenses Section */}
          <div className="grid gap-2 bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="flex items-center justify-between">
              <Label>Lentes AR (Snapchat)</Label>
              <Button type="button" variant="ghost" size="sm" onClick={handleAddLensRow} className="h-8 gap-2">
                <Plus className="h-3 w-3" /> Agregar Lente
              </Button>
            </div>
            
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {(productForm.lenses || []).length === 0 && (
                <div className="text-sm text-muted-foreground italic text-center py-2">
                  No hay lentes asignados. Agrega uno para habilitar la prueba virtual.
                </div>
              )}

              {(productForm.lenses || []).map((lens, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid gap-1">
                    <Input
                      placeholder="Lens ID (UUID)..."
                      value={lens.lensId}
                      onChange={(e) => handleLensChange(index, "lensId", e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="w-[140px]">
                    <Select 
                      value={lens.colorCode || "default"} 
                      onValueChange={(val) => handleLensChange(index, "colorCode", val === "default" ? "" : val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Cualquiera</SelectItem>
                        {parsedColors.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.code }} />
                              {c.code}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLensRow(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {!isEditing && (
            <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <Label>Inventario Inicial por Bodega</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddInventoryRow} 
                  disabled={locations.length === 0}
                  className="h-8 gap-2"
                >
                  <Plus className="h-3 w-3" /> Agregar Ubicación
                </Button>
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {locations.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground space-y-2 text-center">
                    <p>Necesitas crear una bodega antes de registrar stock inicial.</p>
                    <Button size="sm" onClick={onRequestNewLocation} className="gap-2">
                      <Plus className="h-4 w-4" /> Crear bodega
                    </Button>
                  </div>
                )}

                {(productForm.inventory || []).map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Select
                        value={item.locationId}
                        onValueChange={(val) => handleInventoryChange(index, "locationId", val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona bodega" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-[100px]">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Cant."
                        value={item.quantity}
                        onChange={(e) => handleInventoryChange(index, "quantity", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveInventoryRow(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {(productForm.inventory || []).length === 0 && locations.length > 0 && (
                  <div className="text-sm text-muted-foreground italic text-center py-2">
                    Sin stock inicial.
                  </div>
                )}
              </div>
            </div>
          )}
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
