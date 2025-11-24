"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Account {
  name: string
  email: string
  role: "cliente" | "admin"
  token: string
}

interface AccountSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSelectAccount: (token: string) => void
  onAddAccount: () => void
  onRemoveAccount?: (email: string) => void
}

export function AccountSelectionDialog({
  open,
  onOpenChange,
  accounts,
  onSelectAccount,
  onAddAccount,
  onRemoveAccount
}: AccountSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">Elige una cuenta</DialogTitle>
          <DialogDescription className="text-center">
            Selecciona una cuenta para iniciar sesión o añade una nueva.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-4 max-h-[60vh] overflow-y-auto">
          {accounts.map((account) => (
            <div
              key={account.email}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Avatar>
                  <AvatarFallback>{account.name ? account.name.slice(0, 2).toUpperCase() : "??"}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{account.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{account.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => onSelectAccount(account.token)}
                 >
                    Iniciar sesión
                 </Button>
                 {onRemoveAccount && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => onRemoveAccount(account.email)}
                            >
                                Eliminar cuenta
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                 )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center border-t pt-4">
            <Button variant="ghost" onClick={onAddAccount} className="gap-2">
                <Plus className="h-4 w-4" />
                Añadir cuenta
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
