import { cn } from "@/lib/utils"

interface MetricCardProps {
  label: string
  value: string
  className?: string
}

export function MetricCard({ label, value, className }: MetricCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl px-5 py-3", className)}>
      <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}
