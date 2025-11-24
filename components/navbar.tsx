"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, LayoutDashboard, Package, ShoppingBag, Layers, Settings, Home, User, Check, Plus, Loader2, X, Search } from "lucide-react"
import Image from "next/image"
import { apiFetch } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LoginDialog } from "@/components/auth/login-dialog"

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userRole, setUserRole] = useState<"cliente" | "admin" | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [accounts, setAccounts] = useState<{ name: string; email: string; role: "cliente" | "admin"; token: string }[]>([])
  const [isSwitching, setIsSwitching] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const role = localStorage.getItem("userRole") as "cliente" | "admin" | null
    const storedName = localStorage.getItem("userName")
    
    try {
      const saved = JSON.parse(localStorage.getItem("savedAccounts") || "[]")
      // Clean up: Only keep accounts with email and token, and deduplicate by email
      const validAccounts = saved.filter((a: any) => a.email && a.token)
      const uniqueAccounts = Array.from(new Map(validAccounts.map((item: any) => [item.email, item])).values()) as typeof accounts
      
      setAccounts(uniqueAccounts)
      // Update storage if we cleaned anything up
      if (saved.length !== uniqueAccounts.length) {
          localStorage.setItem("savedAccounts", JSON.stringify(uniqueAccounts))
      }
    } catch (e) {
      console.error("Failed to parse saved accounts", e)
      localStorage.removeItem("savedAccounts")
    }

    setUserRole(role)
    if (storedName) {
      setUserName(storedName)
    }

    const fetchUser = async () => {
      try {
        const response = await apiFetch<{ data: { display_name: string; email: string; role: "cliente" | "admin" } | null }>("/api/auth/me")
        if (response.data) {
          setUserName(response.data.display_name)
          setUserEmail(response.data.email)
          setUserRole(response.data.role)
          localStorage.setItem("userRole", response.data.role)
          localStorage.setItem("userName", response.data.display_name)
        } else {
          localStorage.removeItem("userRole")
          localStorage.removeItem("userName")
          setUserRole(null)
          setUserName(null)
          setUserEmail(null)
        }
      } catch (error) {
        // Silently fail if not authenticated
        console.debug("User not authenticated", error)
        localStorage.removeItem("userRole")
        localStorage.removeItem("userName")
        setUserRole(null)
        setUserName(null)
        setUserEmail(null)
      }
    }
    
    fetchUser()
  }, [pathname])

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" })
    } catch (error) {
      console.error(error)
    }
    localStorage.removeItem("userRole")
    localStorage.removeItem("userName")
    setUserRole(null)
    setUserName(null)
    setUserEmail(null)
    router.push("/")
  }

  const handleSwitchAccount = async (token?: string) => {
      if (!token) {
          await handleLogout()
          router.push("/login")
          return
      }

      setIsSwitching(true)
      try {
          await apiFetch("/api/auth/switch-session", {
              method: "POST",
              body: JSON.stringify({ token })
          })
          // Force reload to ensure cookie is picked up by server components
          window.location.reload()
      } catch (error) {
          console.error("Failed to switch account", error)
          setIsSwitching(false)
          // If token is invalid, redirect to login
          await handleLogout()
          router.push("/login")
      }
  }

  const handleRemoveAccount = (email: string) => {
    const newAccounts = accounts.filter(a => a.email !== email)
    setAccounts(newAccounts)
    localStorage.setItem("savedAccounts", JSON.stringify(newAccounts))
  }

  const publicLinks = [
    { href: "/", label: "Inicio", icon: Home },
    { href: "/productos", label: "Catálogo", icon: ShoppingBag },
  ]

  const adminLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/inventario", label: "Inventario", icon: Package },
    { href: "/productos", label: "Catálogo", icon: ShoppingBag },
    { href: "/categorias", label: "Categorías", icon: Layers },
    { href: "/configuracion", label: "Configuración", icon: Settings },
  ]

  const links = userRole === "admin" ? adminLinks : publicLinks

  return (
    <>
      {isSwitching && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Cambiando de cuenta...</p>
          </div>
        </div>
      )}
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          isScrolled 
            ? "bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-sm" 
            : "bg-card border-b border-border"
        )}
      >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href={userRole === "admin" ? "/dashboard" : "/"} className="flex items-center" prefetch={true}>
            <Image src="/logo.png" alt="TryOnWeb Logo" width={50} height={32} className="object-contain h-8 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
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
            {pathname === "/productos" && (
              <div className="flex items-center relative w-10 h-10 justify-center">
                {isSearchOpen ? (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] md:w-72 z-50 max-w-[300px]">
                    <div className="relative w-full">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        autoFocus
                        type="text"
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-8 h-9 bg-background shadow-lg border-muted"
                        defaultValue={searchParams.get("search")?.toString()}
                        onChange={(e) => {
                          const params = new URLSearchParams(searchParams)
                          if (e.target.value) {
                            params.set("search", e.target.value)
                          } else {
                            params.delete("search")
                          }
                          router.replace(`${pathname}?${params.toString()}`)
                        }}
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-0 top-0 h-9 w-9 hover:bg-transparent"
                        onClick={() => setIsSearchOpen(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSearchOpen(true)}
                    className="text-foreground hover:bg-accent"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                )}
              </div>
            )}

            {userRole && (
              <div className="hidden md:flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {userName 
                            ? userName.slice(0, 2).toUpperCase() 
                            : (userRole === 'admin' ? 'AD' : 'CL')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userName || (userRole === 'admin' ? 'Administrador' : 'Cliente')}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userRole === 'admin' ? 'Administrador' : 'Cliente'}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Accounts Section */}
                    {accounts.length > 0 && (
                        <>
                            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal px-2 py-1.5">Cuentas</DropdownMenuLabel>
                            {accounts.map((account, index) => (
                                <DropdownMenuItem 
                                    key={account.email || account.name || `acc-${index}`} 
                                    onClick={() => {
                                        const isCurrent = account.email ? account.email === userEmail : account.name === userName
                                        if (!isCurrent) handleSwitchAccount(account.token)
                                    }} 
                                    className="flex items-center justify-between cursor-pointer group"
                                >
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">{account.name ? account.name.slice(0, 2).toUpperCase() : "??"}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{account.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">{account.role}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {((account.email && account.email === userEmail) || (!account.email && account.name === userName)) && <Check className="h-4 w-4 text-primary" />}
                                        <div
                                            role="button"
                                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (account.email) handleRemoveAccount(account.email)
                                            }}
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                        </>
                    )}

                    <DropdownMenuItem onClick={() => setShowLoginModal(true)} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                            </div>
                            <span>Agregar cuenta</span>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="text-cyan-600 focus:text-cyan-600 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!userRole && (
              <Link href="/login" prefetch={true}>
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
              <SheetContent className="w-[300px] sm:w-[350px] p-0 border-l border-border/50">
                <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl">
                  {/* Header */}
                  <div className="p-6 border-b border-border/40 flex flex-col items-center justify-center bg-muted/20">
                    <div className="relative h-16 w-16 mb-4 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2">
                      <Image src="/logo.png" alt="TryOnWeb" width={60} height={60} className="object-contain" />
                    </div>
                    <h2 className="font-display text-lg font-bold text-foreground">TryOnWeb</h2>
                    <p className="text-xs text-muted-foreground">Gestión Inteligente</p>
                  </div>

                  {/* Navigation */}
                  <div className="flex-1 overflow-y-auto py-6 px-4">
                    <div className="space-y-2">
                      {links.map((link) => {
                        const isActive = pathname === link.href
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            prefetch={true}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                          >
                            <link.icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"}`} />
                            {link.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-border/40 bg-muted/30">
                    {userRole ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 px-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {userName || (userRole === "admin" ? "Administrador" : "Cliente")}
                            </p>
                            <p className="text-xs text-muted-foreground">{userRole === "admin" ? "Administrador" : "Cliente"}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsOpen(false)
                            setShowLogoutConfirm(true)
                          }}
                          className="w-full justify-center gap-2 rounded-xl shadow-sm border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </Button>
                      </div>
                    ) : (
                      <Link href="/login" onClick={() => setIsOpen(false)} prefetch={true}>
                        <Button className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 h-12 text-base">
                          Acceder a mi cuenta
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro que quieres salir de tu cuenta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-cyan-600 hover:bg-cyan-700 text-white">
              Cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LoginDialog open={showLoginModal} onOpenChange={setShowLoginModal} />
    </nav>
    <div className="h-14" aria-hidden="true" />
    </>
  )
}
