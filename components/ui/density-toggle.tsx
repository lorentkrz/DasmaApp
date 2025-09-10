"use client"

import * as React from "react"

type Density = "comfortable" | "compact"

export function DensityToggle({ className }: { className?: string }) {
  const [density, setDensity] = React.useState<Density>("comfortable")

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("ui_density") as Density | null
      const d = saved === "compact" || saved === "comfortable" ? saved : "comfortable"
      setDensity(d)
      document.documentElement.setAttribute("data-density", d)
    } catch {}
  }, [])

  const apply = (next: Density) => {
    setDensity(next)
    try { localStorage.setItem("ui_density", next) } catch {}
    document.documentElement.setAttribute("data-density", next)
  }

  return (
    <div className={className}>
      <div className="flex items-center rounded-md border border-white/20 dark:border-white/10 overflow-hidden backdrop-blur supports-[backdrop-filter]:bg-white/40 dark:bg-slate-800/40">
        <button
          className={`px-3 h-9 text-sm ${density === "comfortable" ? "bg-white/60 dark:bg-slate-900/60 font-medium" : "hover:bg-white/30 dark:hover:bg-slate-900/30"}`}
          onClick={() => apply("comfortable")}
          aria-pressed={density === "comfortable"}
        >
          Comfortable
        </button>
        <button
          className={`px-3 h-9 text-sm border-l border-white/20 dark:border-white/10 ${density === "compact" ? "bg-white/60 dark:bg-slate-900/60 font-medium" : "hover:bg-white/30 dark:hover:bg-slate-900/30"}`}
          onClick={() => apply("compact")}
          aria-pressed={density === "compact"}
        >
          Compact
        </button>
      </div>
    </div>
  )
}
