"use client"

import Link from "next/link"
import { ArrowLeft, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function ProductoDetallePage() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserRole(localStorage.getItem("userRole"))
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/productos"
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <div className="aspect-square bg-accent rounded-2xl overflow-hidden mb-4 relative">
              <Image src="/aviator-sunglasses.png" alt="Gafas de Sol Aviador" fill className="object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-accent rounded-lg cursor-pointer hover:ring-2 ring-primary transition-all"
                />
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div>
            <div className="mb-6">
              <p className="text-muted-foreground mb-2">Accesorios</p>
              <h1 className="font-display text-4xl font-bold text-foreground mb-4">Gafas de Sol Aviador</h1>
              <p className="text-3xl font-bold text-foreground mb-6">$89.99</p>
              <p className="text-muted-foreground text-pretty leading-relaxed">
                Gafas de sol estilo aviador clásico con lentes polarizadas y protección UV400. Montura de metal
                resistente con acabado premium. Perfectas para cualquier ocasión.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-8">
              <Link href="/probador-virtual" className={userRole === "admin" ? "flex-1" : "w-full"}>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Eye className="mr-2 h-5 w-5" />
                  Probar con AR
                </Button>
              </Link>
              {userRole === "admin" && (
                <Button variant="outline">
                  <Edit className="mr-2 h-5 w-5" />
                  Editar
                </Button>
              )}
            </div>

            {/* Product Info Cards */}
            {userRole === "admin" && (
              <div className="grid grid-cols-2 gap-4 mb-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">Stock Disponible</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">45 unidades</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">SKU</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">AVT-001</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Especificaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Material</span>
                    <span className="font-medium text-foreground">Metal y Policarbonato</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Protección UV</span>
                    <span className="font-medium text-foreground">UV400</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Peso</span>
                    <span className="font-medium text-foreground">28g</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Garantía</span>
                    <span className="font-medium text-foreground">12 meses</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
