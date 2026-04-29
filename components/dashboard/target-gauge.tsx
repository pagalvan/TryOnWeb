"use client"

const clamp = (value: number) => Math.min(100, Math.max(0, value))

const radius = 60
const centerX = 75
const centerY = 75
const circumference = Math.PI * radius

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

const pathD = describeArc(centerX, centerY, radius, 180, 0)

type TargetGaugeProps = {
  value: number
}

export function TargetGauge({ value }: TargetGaugeProps) {
  const progress = clamp(value)
  const dashOffset = circumference - (progress / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 150 95" className="w-full max-w-[220px]">
        <path
          d={pathD}
          fill="none"
          stroke="#e4e8f5"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d={pathD}
          fill="none"
          stroke="url(#target-gauge-gradient)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
        <defs>
          <linearGradient id="target-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6479ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-6 flex flex-col items-center">
        <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">{progress.toFixed(2)}%</p>
        <span className="mt-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">+{(progress / 5).toFixed(2)}%</span>
      </div>
    </div>
  )
}
