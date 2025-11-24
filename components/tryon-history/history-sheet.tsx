"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Download, History, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TryOnRecord {
  id: string
  image_url: string
  tryon_type: 'ai' | 'lens'
  created_at: string
  prendas?: {
    nombre: string
    sku: string
  }
}

export function TryOnHistorySheet() {
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<TryOnRecord[]>([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tryon-history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error("Failed to fetch history", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchHistory()
    }
  }, [open])

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error("Download failed", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" title="Historial de Pruebas">
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Historial de Pruebas</SheetTitle>
          <SheetDescription>
            Tus pruebas virtuales guardadas (IA y Lentes).
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes pruebas guardadas aún.
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {item.prendas?.nombre || "Prenda desconocida"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), "PPP 'a las' p", { locale: es })}
                      </p>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mt-1">
                        {item.tryon_type === 'ai' ? 'IA Generativa' : 'Realidad Aumentada'}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDownload(item.image_url, `tryon-${item.id}.jpg`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-md bg-muted">
                    <Image
                      src={item.image_url}
                      alt="Try-on result"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
