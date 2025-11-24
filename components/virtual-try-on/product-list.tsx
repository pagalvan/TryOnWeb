"use client"

import Image from "next/image"
import { RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency, getLensId, type LensProduct } from "./types"

interface ProductListProps {
  products: LensProduct[]
  selectedProductId: string | null
  sessionActive: boolean
  sessionMutating: boolean
  onSelectProduct: (productId: string) => void
  onStartProduct: (productId: string) => void
  onRefresh: () => void
}

export function ProductList({
  products,
  selectedProductId,
  sessionActive,
  sessionMutating,
  onSelectProduct,
  onStartProduct,
  onRefresh,
}: ProductListProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Prendas con Lens</CardTitle>
            <CardDescription>Selecciona una prenda y comienza la experiencia AR</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-2" onClick={onRefresh}>
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.map((product) => {
          const lensId = getLensId(product)
          const isSelected = selectedProductId === product.id
          const isActive = sessionActive && isSelected

          return (
            <div
              key={product.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectProduct(product.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition",
                isSelected
                  ? "border-primary/60 shadow-md"
                  : "border-border hover:border-primary/40 hover:bg-muted/40",
              )}
              onKeyDown={(event: React.KeyboardEvent) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  onSelectProduct(product.id)
                }
              }}
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={product.metadata?.image_url || "/placeholder.svg"}
                  alt={product.nombre}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">{product.nombre}</span>
                  <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600">Lens</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {product.categorias?.nombre ?? "Sin categoría"}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(product.valor_unitario)}</span>
                  <span>•</span>
                  <span className="capitalize">{product.estado}</span>
                  <span>•</span>
                  <span className="font-mono text-xs">{lensId}</span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="ml-auto"
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation()
                  onStartProduct(product.id)
                }}
                disabled={isActive || sessionMutating}
              >
                {isActive ? "En uso" : sessionActive ? "Aplicar" : "Probar"}
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
