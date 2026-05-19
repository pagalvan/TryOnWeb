'use client'

import type { ComponentType } from 'react'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'

import { type InventoryFlowPoint } from '@/lib/types/analytics'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

type InventoryFlowChartProps = {
  data: InventoryFlowPoint[]
}

const COLORS = {
  inbound: 'hsl(142 76% 45%)',
  outbound: 'hsl(11 90% 58%)',
}

export function InventoryFlowChart({ data }: InventoryFlowChartProps) {
  const TooltipComponent = Tooltip as unknown as ComponentType<any>
  const tooltipProps: Record<string, unknown> = {}
  tooltipProps['content'] = (props: unknown) => <ChartTooltipContent {...(props as any)} />
  tooltipProps['cursor'] = { fill: 'rgba(148, 163, 184, 0.1)' }

  return (
    <ChartContainer
      config={{
        inbound: { label: 'Entradas', color: COLORS.inbound },
        outbound: { label: 'Salidas', color: COLORS.outbound },
      }}
      className="aspect-[16/9]"
    >
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          tickFormatter={(value) =>
            format(new Date(value), 'dd MMM', {
              locale: es,
            })
          }
        />
        <YAxis tickLine={false} axisLine={false} width={32} />
        <TooltipComponent {...(tooltipProps as any)} />
        <Bar dataKey="inbound" fill={COLORS.inbound} radius={[8, 8, 0, 0]} name="Entradas" />
        <Bar dataKey="outbound" fill={COLORS.outbound} radius={[8, 8, 0, 0]} name="Salidas" />
      </BarChart>
    </ChartContainer>
  )
}
