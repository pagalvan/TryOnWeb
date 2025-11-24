"use client"

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
import { getLensId, type LensProduct } from "./types"

interface PermissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pendingProduct: LensProduct | null
  onConfirm: () => void
  onCancel: () => void
}

export function PermissionDialog({
  open,
  onOpenChange,
  pendingProduct,
  onConfirm,
  onCancel,
}: PermissionDialogProps) {
  const pendingLensId = getLensId(pendingProduct)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Permite el acceso a tu cámara</AlertDialogTitle>
          <AlertDialogDescription>
            Seleccionamos {pendingProduct?.nombre ?? "la prenda"}. Autoriza la cámara del navegador para
            renderizar el Lens{" "}
            <span className="font-mono text-xs uppercase">{pendingLensId || "N/A"}</span> en tiempo real.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Permitir y continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
