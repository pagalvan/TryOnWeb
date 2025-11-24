"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { DashboardSectionLink, DashboardSectionId } from "@/app/dashboard/_data"

type DashboardSectionNavProps = {
  items: readonly DashboardSectionLink[]
  activeSection: DashboardSectionId
}

export function DashboardSectionNav({ items, activeSection }: DashboardSectionNavProps) {
  const pathname = usePathname()

  return (
    <nav aria-label="Secciones del panel" className="sticky top-20 z-10 pb-2 pt-1">
      <div className="flex w-full flex-wrap items-center justify-center gap-2 text-xs font-semibold">
        {items.map((item) => {
          const matchesPath = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}`))
          const isActive = item.id === activeSection || matchesPath
          const baseClasses = "rounded-full border px-4 py-1.5 transition"
          const inactiveClasses = "border-slate-200 bg-white/90 text-slate-600 hover:border-slate-300 hover:text-slate-900"
          const activeClasses = "border-slate-900 bg-slate-900 text-white shadow"

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
