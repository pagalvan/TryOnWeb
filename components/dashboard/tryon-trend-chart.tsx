'use client'

import type { ComponentType } from 'react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { type TryOnTrendPoint } from '@/lib/types/analytics'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

type TryOnTrendChartProps = {
  data: TryOnTrendPoint[]
}

const COLORS = {
  sessions: 'hsl(201 100% 50%)',
  items: 'hsl(39 100% 55%)',
}

export function TryOnTrendChart({ data }: TryOnTrendChartProps) {
  const TooltipComponent = Tooltip as unknown as ComponentType<any>
  const tooltipProps: Record<string, unknown> = {}
  tooltipProps['content'] = (props: unknown) => <ChartTooltipContent {...(props as any)} />
  tooltipProps['cursor'] = { strokeDasharray: '4 4' }

  return (
    <ChartContainer
      config={{
        sessions: { label: 'Sesiones', color: COLORS.sessions },
        items: { label: 'Prendas probadas', color: COLORS.items },
      }}
      className="aspect-[16/9]"
    >
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={(value) =>
            format(new Date(value), 'dd MMM', {
              locale: es,
            })
          }
        />
        <YAxis tickLine={false} axisLine={false} width={36} />
        <TooltipComponent {...(tooltipProps as any)} />
        <Line
          type="monotone"
          dataKey="sessions"
          stroke={COLORS.sessions}
          strokeWidth={2}
          dot={false}
          name="Sesiones"
        />
        <Line
          type="monotone"
          dataKey="items"
          stroke={COLORS.items}
          strokeWidth={2}
          dot={false}
          name="Prendas probadas"
        />
      </LineChart>
    </ChartContainer>
  )
}
