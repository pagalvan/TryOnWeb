"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Loader2, Upload, Wand2, X, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface GeminiTryOnDialogProps {
  productImage: string
  productName: string
}

export function GeminiTryOnDialog({ productImage, productName }: GeminiTryOnDialogProps) {
  const [open, setOpen] = useState(false)
  const [personImage, setPersonImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const resizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new window.Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          // Reduce max dimension to 512 to save tokens and avoid rate limits
          const MAX_WIDTH = 512
          const MAX_HEIGHT = 512
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          // Reduce quality slightly to further reduce size
          resolve(canvas.toDataURL('image/jpeg', 0.7))
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const resizedImage = await resizeImage(file)
        setPersonImage(resizedImage)
      } catch (error) {
        console.error("Error resizing image:", error)
        toast({
          title: "Error",
          description: "No se pudo procesar la imagen. Intenta con otra.",
          variant: "destructive",
        })
      }
    }
  }

  const handleMerge = async (retryCount = 0) => {
    if (!personImage || !productImage) return

    setLoading(true)
    setResult(null)

    try {
      // Convert product image URL to base64 if it's not already (assuming it's a URL)
      // For simplicity, we'll try to fetch it and convert to blob then base64
      // If it's a relative path, we might need to handle it.
      
      let garmentBase64 = productImage;
      // Only fetch if it's a local relative path (starts with /) to avoid CORS with external URLs
      // External URLs will be handled by the server
      if (productImage.startsWith('/')) {
        try {
            const response = await fetch(productImage);
            const blob = await response.blob();
            garmentBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.error("Error converting local product image to base64", e);
        }
      }

      const response = await fetch('/api/gemini-try-on', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personImage,
          garmentImage: garmentBase64,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
             if (retryCount < 10) {
                 // Auto retry after delay with progressive backoff
                 const delay = 3000 + (retryCount * 2000); // 3s, 5s, 7s, 9s...
                 toast({
                    title: "Sistema saturado",
                    description: `Esperando disponibilidad... (${retryCount + 1}/10)`,
                 })
                 await new Promise(resolve => setTimeout(resolve, delay));
                 return handleMerge(retryCount + 1);
             }
             throw new Error("El sistema está muy saturado. Por favor intenta en unos minutos.");
        }
        throw new Error(data.error || 'Failed to process images')
      }

      setResult(data.result)
      toast({
        title: "Fusión completada",
        description: "La IA ha procesado tu solicitud.",
      })
      setLoading(false)
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Error",
        description: error.message || "No se pudo realizar la fusión. Intenta nuevamente.",
        variant: "destructive",
      })
      setLoading(false)
    } finally {
      // Loading state is handled in try/catch blocks to support retry logic
      if (retryCount >= 10) {
          setLoading(false)
      }
    }
  }

  const handleSave = async () => {
    if (!result) return
    
    try {
      const response = await fetch('/api/tryon-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: result,
          tryon_type: 'ai',
          metadata: { productName }
        })
      })
      
      if (response.ok) {
        toast({ title: "Guardado", description: "Prueba guardada en tu historial." })
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la prueba.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white">
          <Wand2 className="mr-2 h-4 w-4" />
          Probador Virtual IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Probador Virtual con Gemini IA</DialogTitle>
          <DialogDescription>
            Sube tu foto para ver cómo te queda {productName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Person Image Upload */}
            <div className="space-y-2">
              <Label>Tu Foto</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 h-64 flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {personImage ? (
                  <>
                    <Image 
                      src={personImage} 
                      alt="Person" 
                      fill 
                      className="object-contain" 
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="text-white font-medium">Cambiar foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para subir una foto de cuerpo completo
                    </span>
                  </>
                )}
                <Input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>

            {/* Product Image Display */}
            <div className="space-y-2">
              <Label>Prenda</Label>
              <div className="border rounded-lg p-4 h-64 flex items-center justify-center relative overflow-hidden bg-accent/20">
                <Image 
                  src={productImage} 
                  alt={productName} 
                  fill 
                  className="object-contain" 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={() => handleMerge(0)} 
              disabled={!personImage || loading}
              className="w-full md:w-1/2"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando con Gemini...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Fusionar Imágenes
                </>
              )}
            </Button>
          </div>

          {/* Result Display */}
          {result && (
            <div className="space-y-2 border-t pt-4 mt-2">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Resultado</Label>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
              <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                {/* Since Gemini 1.5 Flash returns text, we display text. 
                    If it returned an image URL, we would display an Image component. 
                    We'll try to detect if it's a URL or text. */}
                {result.startsWith('http') || result.startsWith('data:image') ? (
                   <div className="relative h-96 w-full">
                     <Image src={result} alt="Result" fill className="object-contain" />
                   </div>
                ) : (
                   <p>{result}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Nota: Gemini 1.5 Flash es un modelo multimodal que genera texto. 
                Para generación de imágenes real, se requeriría un modelo de generación de imágenes (como Imagen 3).
                El texto arriba es la respuesta del modelo a la solicitud de fusión.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
