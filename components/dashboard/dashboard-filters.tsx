'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { addDays, format } from 'date-fns'
import { es } from 'date-fns/locale'
import { type DateRange } from 'react-day-picker'
import {
  CalendarIcon,
  FileDown,
  FileSpreadsheet,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react'

import { type DashboardAvailableFilters, type DashboardFiltersState } from '@/lib/types/analytics'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

type DashboardFiltersProps = {
  filters: DashboardFiltersState
  availableFilters: DashboardAvailableFilters
}

const formatRangeLabel = (range: DateRange | undefined) => {
  if (!range?.from || !range?.to) return 'Selecciona rango'
  const sameMonth = format(range.from, 'MMM', { locale: es }) === format(range.to, 'MMM', { locale: es })
  const fromLabel = format(range.from, sameMonth ? "dd" : "dd MMM", { locale: es })
  const toLabel = format(range.to, "dd MMM", { locale: es })
  return `${fromLabel} – ${toLabel}`
}

const toQueryDate = (date: Date) => format(date, 'yyyy-MM-dd')

export function DashboardFilters({ filters, availableFilters }: DashboardFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [optimisticFilters, setOptimisticFilters] = useState(filters)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setOptimisticFilters(filters)
  }, [filters])

  const fromDate = useMemo(() => new Date(optimisticFilters.from), [optimisticFilters.from])
  const toDate = useMemo(() => new Date(optimisticFilters.to), [optimisticFilters.to])

  const selectedRange = useMemo<DateRange>(() => ({ from: fromDate, to: toDate }), [fromDate, toDate])

  const exportQuery = useMemo(() => {
    const query = new URLSearchParams()
    query.set('from', toQueryDate(fromDate))
    query.set('to', toQueryDate(toDate))
    if (optimisticFilters.categoryId) query.set('categoryId', optimisticFilters.categoryId)
    if (optimisticFilters.location) query.set('location', optimisticFilters.location)
    if (optimisticFilters.stockStatus && optimisticFilters.stockStatus !== 'all') {
      query.set('stockStatus', optimisticFilters.stockStatus)
    }
    return query
  }, [optimisticFilters.categoryId, optimisticFilters.location, optimisticFilters.stockStatus, fromDate, toDate])

  const normalizeStatePatch = (patch: Record<string, string | null | undefined>) => {
    const next: Partial<DashboardFiltersState> = {}
    Object.entries(patch).forEach(([key, value]) => {
      if (key === 'from' || key === 'to') {
        if (typeof value === 'string') {
          next[key] = value
        }
        return
      }

      if (key === 'categoryId' || key === 'location') {
        next[key] = !value || value === 'all' ? null : value
        return
      }

      if (key === 'stockStatus') {
        next.stockStatus = value === 'warning' || value === 'critical' ? value : 'all'
      }
    })
    return next
  }

  const applyFilters = (patch: Record<string, string | null | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(patch).forEach(([key, value]) => {
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    setOptimisticFilters((prev) => ({
      ...prev,
      ...normalizeStatePatch(patch),
    }))

    const queryString = params.toString()
    startTransition(() => {
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
      router.refresh()
    })
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range?.from || !range?.to) return
    applyFilters({ from: toQueryDate(range.from), to: toQueryDate(range.to) })
    setOpen(false)
  }

  const handleFastRange = (days: number) => {
    const end = new Date()
    const start = addDays(end, -days)
    applyFilters({ from: toQueryDate(start), to: toQueryDate(end) })
  }

  const resetFilters = () => {
    const end = new Date()
    const start = addDays(end, -29)
    applyFilters({
      from: toQueryDate(start),
      to: toQueryDate(end),
      categoryId: null,
      location: null,
      stockStatus: "all",
    })
  }

  const pdfHref = useMemo(() => {
    const query = new URLSearchParams(exportQuery)
    query.set('format', 'pdf')
    return `/api/dashboard/export?${query.toString()}`
  }, [exportQuery])

  const excelHref = useMemo(() => {
    const query = new URLSearchParams(exportQuery)
    query.set('format', 'excel')
    return `/api/dashboard/export?${query.toString()}`
  }, [exportQuery])

  return (
    <div className="flex flex-col gap-5 rounded-[22px] border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_22px_55px_rgba(37,56,88,0.08)]">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-400">
          <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
          Filtros avanzados
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFastRange(6)}
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Últimos 7 días
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleFastRange(29)}
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            Últimos 30 días
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr,1fr,1fr,1fr]">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-auto justify-between rounded-[18px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 text-left font-normal text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 via-white to-indigo-100 text-indigo-500 shadow-sm">
                  <CalendarIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">Rango de fechas</p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{formatRangeLabel(selectedRange)}</p>
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={fromDate}
              selected={selectedRange}
              onSelect={handleRangeSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select
          value={optimisticFilters.categoryId ?? 'all'}
          onValueChange={(value) => applyFilters({ categoryId: value === 'all' ? null : value })}
          disabled={isPending}
        >
          <SelectTrigger className="h-[58px] rounded-[18px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {availableFilters.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={optimisticFilters.location ?? 'all'}
          onValueChange={(value) => applyFilters({ location: value === 'all' ? null : value })}
          disabled={isPending}
        >
          <SelectTrigger className="h-[58px] rounded-[18px] border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 shadow-sm hover:bg-white dark:hover:bg-slate-800 dark:bg-slate-900">
            <SelectValue placeholder="Todas las ubicaciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las ubicaciones</SelectItem>
            {availableFilters.locations.map((location) => (
              <SelectItem key={location} value={location}>
                {location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-400">Alertas de stock</span>
          <ToggleGroup
            type="single"
            value={optimisticFilters.stockStatus ?? 'all'}
            onValueChange={(value) => {
              if (!value) return
              applyFilters({ stockStatus: value })
            }}
            className="w-full rounded-full bg-slate-100 dark:bg-slate-800 p-1"
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="all" className="rounded-full px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 data-[state=on]:bg-white dark:data-[state=on]:bg-slate-900 data-[state=on]:text-slate-900 dark:data-[state=on]:text-slate-50 first:rounded-full last:rounded-full">
              Todos
            </ToggleGroupItem>
            <ToggleGroupItem value="warning" className="rounded-full px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 data-[state=on]:bg-white dark:data-[state=on]:bg-slate-900 data-[state=on]:text-slate-900 dark:data-[state=on]:text-slate-50 first:rounded-full last:rounded-full">
              Atención
            </ToggleGroupItem>
            <ToggleGroupItem value="critical" className="rounded-full px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 data-[state=on]:bg-white dark:data-[state=on]:bg-slate-900 data-[state=on]:text-slate-900 dark:data-[state=on]:text-slate-50 first:rounded-full last:rounded-full">
              Crítico
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Exporta los datos del periodo seleccionado en el formato que prefieras.
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
            asChild
          >
            <Link href={pdfHref} prefetch={false}>
              <FileDown className="mr-2 h-4 w-4" /> PDF
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800/50"
            asChild
          >
            <Link href={excelHref} prefetch={false}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
