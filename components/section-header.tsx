"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  className?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, subtitle, className, action }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-2", className)}>
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="shrink-0">{action}</div>
      )}
    </div>
  )
}
