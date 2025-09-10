"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

type KPICardProps = {
  title: string
  value: string | number
  delta?: { value: string; positive?: boolean } | null
  trendData?: number[]
  size?: "sm" | "md" | "lg"
  className?: string
}

export function KPICard({ title, value, delta, trendData, size = "md", className }: KPICardProps) {
  const height = size === "lg" ? "h-32" : size === "sm" ? "h-24" : "h-28"

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border glass",
        height,
        className
      )}
      initial={{ y: 4, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.2, 0.9, 0.27, 1] }}
      whileHover={{ scale: 1.02, boxShadow: "var(--shadow-card-hover-light)" as any }}
    >
      <div className="absolute inset-y-0 left-0 w-3" style={{ backgroundImage: "var(--gradient-primary-2025)" }} />
      <div className="ml-2 grid grid-cols-3 gap-2 p-4">
        <div className="col-span-2">
          <div className="text-xs font-medium text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]">
            {title}
          </div>
          <div className="mt-1 text-3xl font-bold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
            {value}
          </div>
          {delta && (
            <div
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                delta.positive === true
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : delta.positive === false
                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                  : "bg-gray-500/10 text-gray-600 dark:text-gray-400"
              )}
            >
              {delta.positive === true ? (
                <TrendingUp className="h-3 w-3" />
              ) : delta.positive === false ? (
                <TrendingDown className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {delta.value}
            </div>
          )}
        </div>
        <div className="col-span-1 flex items-end justify-end">
          {trendData && trendData.length > 0 ? (
            <Sparkline data={trendData} />
          ) : (
            <div className="h-12 w-24 rounded-md bg-white/40 dark:bg-slate-900/30" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / (max || 1)) * 100}`)
    .join(" ")

  return (
    <svg viewBox="0 0 100 100" className="h-12 w-24">
      <polyline
        fill="none"
        stroke="url(#kpiGrad)"
        strokeWidth="2"
        points={points}
      />
      <defs>
        <linearGradient id="kpiGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--primary-start, #6366F1)" />
          <stop offset="50%" stopColor="var(--primary-mid, #8B5CF6)" />
          <stop offset="100%" stopColor="var(--primary-end, #3B82F6)" />
        </linearGradient>
      </defs>
    </svg>
  )
}
