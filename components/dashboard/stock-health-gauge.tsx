'use client'

type StockHealthGaugeProps = {
  value: number
  label?: string
  caption?: string
}

const clamp = (value: number) => Math.min(100, Math.max(0, value))

export function StockHealthGauge({ value, label, caption }: StockHealthGaugeProps) {
  const normalized = clamp(value)
  const sweep = (normalized / 100) * 240

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-40 w-40">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from -120deg, hsl(219 85% 55%) ${sweep}deg, hsl(209 28% 88%) ${sweep}deg 240deg, transparent 240deg 360deg)`,
          }}
        />
        <div className="absolute inset-4 rounded-full bg-white dark:bg-slate-900 shadow-inner" />
        <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-white dark:bg-slate-900">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-50">{normalized.toFixed(0)}%</span>
          {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
        </div>
      </div>
      {caption ? <p className="text-center text-xs text-muted-foreground">{caption}</p> : null}
    </div>
  )
}
