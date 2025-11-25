"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Download, History, Loader2, Trash2, Calendar as CalendarIcon, X } from "lucide-react"
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
import { format, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  const [date, setDate] = useState<Date | undefined>(undefined)

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

  const filteredHistory = date 
    ? history.filter(item => isSameDay(new Date(item.created_at), date))
    : history

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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tryon-history?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete", error)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Historial de Pruebas">
          <History className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader className="space-y-4 pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">Historial</SheetTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  size="sm"
                  className={cn(
                    "justify-start text-left font-normal h-8 gap-2",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Filtrar por fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                />
                {date && (
                  <div className="p-2 border-t">
                    <Button 
                      variant="ghost" 
                      className="w-full h-8 text-xs"
                      onClick={() => setDate(undefined)}
                    >
                      Limpiar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-100px)] mt-6 pr-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="bg-muted/50 p-4 rounded-full">
                <History className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground text-sm">
                {date ? "No hay pruebas en esta fecha." : "No tienes pruebas guardadas aún."}
              </p>
              {date && (
                <Button variant="link" onClick={() => setDate(undefined)} className="text-xs">
                  Ver todo el historial
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((item) => (
                <div key={item.id} className="flex items-center p-3 hover:bg-accent/50 rounded-xl transition-all group border border-transparent hover:border-border/50">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2 border-background shadow-sm">
                    <Image
                      src={item.image_url}
                      alt="Try-on result"
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  <div className="ml-4 flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate text-foreground/90">
                      {item.prendas?.nombre || "Prenda desconocida"}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                        {item.tryon_type === 'ai' ? 'IA' : 'AR'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 hover:bg-background hover:text-primary hover:shadow-sm rounded-full"
                      onClick={() => handleDownload(item.image_url, `tryon-${item.id}.jpg`)}
                      title="Guardar imagen"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 text-muted-foreground hover:text-destructive hover:shadow-sm rounded-full"
                      onClick={() => handleDelete(item.id)}
                      title="Borrar del historial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
