"use client"

import * as React from "react"
import { KPICard } from "@/components/ui/kpi-card"

export type KPIItem = {
  title: string
  value: string | number
  delta?: { value: string; positive?: boolean } | null
  trendData?: number[]
  size?: "sm" | "md" | "lg"
}

export function KPIGrid({ items }: { items: KPIItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((kpi, i) => (
        <KPICard key={i} {...kpi} />
      ))}
    </div>
  )
}
