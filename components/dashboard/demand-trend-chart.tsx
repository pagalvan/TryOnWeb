'use client'

import type { ComponentType } from 'react'

import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

type DemandTrendChartPoint = {
  label: string
  views: number
  tryons: number
}

type DemandTrendChartProps = {
  data: DemandTrendChartPoint[]
}

const COLORS = {
  views: '#5f6fff',
  tryons: '#a855f7',
}

export function DemandTrendChart({ data }: DemandTrendChartProps) {
  const TooltipComponent = Tooltip as unknown as ComponentType<any>
  const tooltipProps: Record<string, unknown> = {}
  tooltipProps['content'] = (props: unknown) => <ChartTooltipContent {...(props as any)} />
  tooltipProps['cursor'] = { strokeDasharray: '4 4' }

  return (
    <ChartContainer
      config={{
        views: { label: 'Vistas', color: COLORS.views },
        tryons: { label: 'Try-on', color: COLORS.tryons },
      }}
      className="h-[260px]"
    >
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.views} stopOpacity={0.35} />
            <stop offset="95%" stopColor={COLORS.views} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="colorTryons" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={COLORS.tryons} stopOpacity={0.3} />
            <stop offset="95%" stopColor={COLORS.tryons} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
          width={32}
        />
        <TooltipComponent {...(tooltipProps as any)} />
        <Area
          type="monotone"
          dataKey="views"
          stroke={COLORS.views}
          strokeWidth={2}
          fill="url(#colorViews)"
          dot={false}
          name="Vistas"
        />
        <Area
          type="monotone"
          dataKey="tryons"
          stroke={COLORS.tryons}
          strokeWidth={2}
          fill="url(#colorTryons)"
          dot={false}
          name="Try-on"
        />
      </AreaChart>
    </ChartContainer>
  )
}
