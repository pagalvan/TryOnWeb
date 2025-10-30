"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"
import Image from "next/image"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<"cliente" | "admin" | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem("userRole") as "cliente" | "admin" | null
    setUserRole(role)
  }, [pathname])

  const handleLogout = () => {
    localStorage.removeItem("userRole")
    setUserRole(null)
    router.push("/")
  }

  const publicLinks = [
    { href: "/", label: "Inicio" },
    { href: "/productos", label: "Catálogo" },
    { href: "/probador-virtual", label: "Probador Virtual" },
  ]

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventario", label: "Inventario" },
    { href: "/productos", label: "Productos" },
    { href: "/categorias", label: "Categorías" },
    { href: "/probador-virtual", label: "Probador Virtual" },
    { href: "/reportes", label: "Reportes" },
    { href: "/configuracion", label: "Configuración" },
  ]

  const links = userRole === "admin" ? adminLinks : publicLinks

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={userRole === "admin" ? "/dashboard" : "/"} className="flex items-center">
            <Image src="/logo.png" alt="TryOnWeb Logo" width={50} height={32} className="object-contain" priority />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm transition-colors ${
                  pathname === link.href ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {userRole && (
              <div className="hidden md:flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {userRole === "admin" ? "Administrador" : "Cliente"}
                </span>
                <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 bg-transparent">
                  <LogOut className="h-4 w-4" />
                  Salir
                </Button>
              </div>
            )}

            {!userRole && (
              <Link href="/login">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Acceder</Button>
              </Link>
            )}

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px]">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Logo en mobile */}
                  <Image src="/logo.png" alt="TryOnWeb Logo" width={100} height={40} className="object-contain mb-4" />

                  {/* Links */}
                  <div className="flex flex-col gap-4">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={`text-sm transition-colors ${
                          pathname === link.href
                            ? "text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {/* User info and logout */}
                  {userRole ? (
                    <div className="border-t border-border pt-6 mt-4">
                      <div className="flex flex-col gap-3">
                        <span className="text-sm text-muted-foreground">
                          Sesión: {userRole === "admin" ? "Administrador" : "Cliente"}
                        </span>
                        <Button
                          variant="outline"
                          onClick={() => {
                            handleLogout()
                            setIsOpen(false)
                          }}
                          className="gap-2 w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-border pt-6 mt-4">
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                          Acceder
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}
