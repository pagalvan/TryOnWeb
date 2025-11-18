'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseISO } from 'date-fns'

import { type DemandTrendPoint } from '@/lib/types/analytics'
import { Button } from '@/components/ui/button'

import { DemandTrendChart } from './demand-trend-chart'

const OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annually' },
] as const

type Timeframe = (typeof OPTIONS)[number]['value']

type DemandTrendWidgetProps = {
  data: DemandTrendPoint[]
}

const aggregateTrend = (data: DemandTrendPoint[], timeframe: Timeframe) => {
  const buckets = new Map<
    string,
    {
      label: string
      views: number
      tryons: number
      order: number
    }
  >()

  for (const point of data) {
    const date = parseISO(point.date)
    if (Number.isNaN(date.getTime())) continue

    let key = ''
    let label = ''
    let order = 0

    switch (timeframe) {
      case 'quarterly': {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        key = `${date.getFullYear()}-Q${quarter}`
        label = `Q${quarter} ${String(date.getFullYear()).slice(-2)}`
        order = date.getFullYear() * 10 + quarter
        break
      }
      case 'annual': {
        key = format(date, 'yyyy')
        label = key
        order = Number(key)
        break
      }
      case 'monthly':
      default: {
        key = format(date, 'yyyy-MM')
        label = format(date, "MMM", { locale: es })
        order = Number(format(date, 'yyyyMM'))
        break
      }
    }

    const entry = buckets.get(key) ?? { label, views: 0, tryons: 0, order }
    entry.views += point.views
    entry.tryons += point.tryons
    buckets.set(key, entry)
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.order - b.order)
    .map(({ label, views, tryons }) => ({ label, views, tryons }))
}

export function DemandTrendWidget({ data }: DemandTrendWidgetProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly')

  const chartData = useMemo(() => aggregateTrend(data, timeframe), [data, timeframe])
  const noData = chartData.every((point) => point.views === 0 && point.tryons === 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-xs font-medium text-slate-600 shadow-inner">
          {OPTIONS.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={timeframe === option.value ? 'default' : 'ghost'}
              className={
                timeframe === option.value
                  ? 'rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm'
                  : 'rounded-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900'
              }
              onClick={() => setTimeframe(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
      {noData ? (
        <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-sm text-muted-foreground">
          No hay datos suficientes para mostrar el comportamiento en este periodo.
        </div>
      ) : (
        <DemandTrendChart data={chartData} />
      )}
    </div>
  )
}
