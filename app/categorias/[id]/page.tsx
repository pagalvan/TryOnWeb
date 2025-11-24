import Link from "next/link"
import { notFound } from "next/navigation"
import { Package, ArrowLeft, ShoppingBag } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCategory, type Category } from "@/lib/services/categories"
import { listProducts, type InventoryProduct } from "@/lib/services/inventory"
import { CATEGORY_ICON_MAP, type IconValue } from "@/components/categories/types"

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return "—"
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value)
}

const getTotalStock = (items: InventoryProduct["inventario_items"]) =>
  items.reduce((total, item) => total + (item.cantidad ?? 0), 0)

type PageParams = {
  params: Promise<{ id: string }>
}

export default async function CategoriaDetallePage({ params }: PageParams) {
  const { id } = await params

  let category: Category | null = null
  let products: InventoryProduct[] = []

  try {
    category = await getCategory(id)
    if (!category) {
      return notFound()
    }
    products = await listProducts({ categoryId: id })
  } catch (error) {
    console.error("No se pudo cargar la categoría", error)
    return notFound()
  }

  const IconComponent = category.icon
    ? CATEGORY_ICON_MAP[category.icon as IconValue]
    : undefined

  return (
    <div className="min-h-screen bg-background">

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            href="/categorias"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div 
              className="h-14 w-14 rounded-xl flex items-center justify-center text-white text-2xl backdrop-blur-sm shadow-inner"
              style={{
                background: "linear-gradient(135deg, rgba(32, 163, 169, 0.65), rgba(13, 110, 123, 0.35))",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                boxShadow: "0 10px 25px rgba(13, 110, 123, 0.15)",
              }}
            >
              {IconComponent ? <IconComponent className="h-7 w-7" /> : <Package className="h-7 w-7" />}
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold text-foreground mb-2">{category.nombre}</CardTitle>
              {category.descripcion ? (
                <p className="text-muted-foreground leading-relaxed max-w-2xl">{category.descripcion}</p>
              ) : (
                <p className="text-muted-foreground">No hay descripción registrada.</p>
              )}
            </div>
            <Badge variant={category.estado === "activa" ? "outline" : "destructive"} className="shrink-0 capitalize">
              {category.estado}
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center text-white backdrop-blur-sm shadow-inner"
                style={{
                  background: "linear-gradient(135deg, rgba(32, 163, 169, 0.65), rgba(13, 110, 123, 0.35))",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 10px 25px rgba(13, 110, 123, 0.15)",
                }}
              >
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Productos asociados</p>
                <p className="text-xl font-semibold text-foreground">{products.length}</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={`/inventario?categoria=${id}`}>Gestionar inventario</Link>
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Productos</h2>
            <Badge variant="secondary" className="text-sm">
              {products.length} elemento{products.length === 1 ? "" : "s"}
            </Badge>
          </div>

          {products.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                No hay productos asociados a esta categoría todavía.
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">{product.nombre}</h3>
                        <p className="text-muted-foreground text-sm truncate" title={product.descripcion ?? undefined}>
                          {product.descripcion ?? "Sin descripción"}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {product.estado}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>SKU</span>
                      <span className="font-medium text-foreground">{product.sku ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Valor unitario</span>
                      <span className="font-medium text-foreground">{formatCurrency(product.valor_unitario)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Stock total</span>
                      <span className="font-medium text-foreground">{getTotalStock(product.inventario_items)}</span>
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/productos/${product.id}`}>Ver detalles</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
