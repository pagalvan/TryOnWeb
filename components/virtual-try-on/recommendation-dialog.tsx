"use client"

import { Wand2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface Recommendation {
  name: string
  category: string
  reason: string
  confidence: number
}

interface RecommendationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendations: Recommendation[] | null
}

export function RecommendationDialog({
  open,
  onOpenChange,
  recommendations,
}: RecommendationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Recomendaciones de Estilo
          </DialogTitle>
          <DialogDescription>
            Basado en tu look actual, nuestra IA sugiere:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {recommendations?.map((rec, index) => (
            <div key={index} className="rounded-lg border p-4 bg-muted/30">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm">{rec.name}</h4>
                <Badge variant="outline" className="text-xs">
                  {rec.category}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{rec.reason}</p>
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${rec.confidence}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {rec.confidence}% Match
                </span>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
