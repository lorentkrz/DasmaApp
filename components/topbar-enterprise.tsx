"use client"

import * as React from "react"
import { HelpCircle, X } from "lucide-react"
import { HelpDialog } from "@/components/help-dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsBell } from "@/components/notifications-bell"

export function TopbarEnterprise() {
  const [query, setQuery] = React.useState("")
  const [density, setDensity] = React.useState<"comfortable" | "compact">("comfortable")
  const [helpOpen, setHelpOpen] = React.useState(false)
  const router = useRouter()
  const [scope, setScope] = React.useState<"all" | "invitations" | "guests" | "vendors">("all")

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("ui_density") as any
      if (saved === "compact" || saved === "comfortable") {
        setDensity(saved)
        document.documentElement.setAttribute("data-density", saved)
      } else {
        document.documentElement.setAttribute("data-density", "comfortable")
      }
      const savedScope = localStorage.getItem("global_search_scope") as any
      if (savedScope === "all" || savedScope === "invitations" || savedScope === "guests" || savedScope === "vendors") {
        setScope(savedScope)
      }
      const savedQuery = localStorage.getItem("global_search_query")
      if (typeof savedQuery === 'string') setQuery(savedQuery)
    } catch {}
  }, [])

  const applyDensity = (next: "comfortable" | "compact") => {
    setDensity(next)
    try { localStorage.setItem("ui_density", next) } catch {}
    document.documentElement.setAttribute("data-density", next)
  }

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-white/10">
      <div className="mx-auto flex h-14 items-center gap-3 px-4 sm:px-6">
        {/* Search (constrained width to make space for notifications) */}
        <div className="flex-1 min-w-0 max-w-[640px]">
          <div className="flex items-center gap-2">
          {/* Single-language mode (language toggle removed) */}
            <Select value={scope} onValueChange={(v: any) => { setScope(v); try { localStorage.setItem("global_search_scope", v) } catch {} }}>
              <SelectTrigger className="h-9 w-[140px]">
                <SelectValue placeholder="Fusha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Të gjitha</SelectItem>
                <SelectItem value="invitations">Ftesat</SelectItem>
                <SelectItem value="guests">Mysafirët</SelectItem>
                <SelectItem value="vendors">Shitësit</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1">
              <Input
                placeholder="Kërko…"
                value={query}
                onChange={(e) => { setQuery(e.target.value); try { localStorage.setItem("global_search_query", e.target.value) } catch {} }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = query.trim()
                    if (q.length > 0) {
                      const url =
                        scope === 'invitations' ? `/dashboard/invitations?q=${encodeURIComponent(q)}` :
                        scope === 'guests' ? `/dashboard/search?scope=guests&q=${encodeURIComponent(q)}` :
                        scope === 'vendors' ? `/dashboard/vendors?q=${encodeURIComponent(q)}` :
                        `/dashboard/search?q=${encodeURIComponent(q)}`
                      router.push(url)
                    }
                  }
                }}
                className="h-9 pr-8"
                aria-label="Search"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Pastro kërkimin"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => { setQuery(""); try { localStorage.removeItem("global_search_query") } catch {} }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <div className="hidden sm:flex items-center rounded-md border border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
            <button
              className={`px-3 h-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-2025)] dark:focus-visible:ring-[color:var(--border-dark)] ${density === "comfortable" ? "bg-white dark:bg-slate-900 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              onClick={() => applyDensity("comfortable")}
              aria-pressed={density === "comfortable"}
            >
              Comfortable
            </button>
            <button
              className={`px-3 h-9 text-sm border-l border-[color:var(--border-2025)] dark:border-[color:var(--border-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--border-2025)] dark:focus-visible:ring-[color:var(--border-dark)] ${density === "compact" ? "bg-white dark:bg-slate-900 font-medium" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
              onClick={() => applyDensity("compact")}
              aria-pressed={density === "compact"}
            >
              Compact
            </button>
          </div>
          {/* Notifications bell directly left of Profili */}
          <NotificationsBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Profili</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Llogaria</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profili</DropdownMenuItem>
              <DropdownMenuItem>Cilësimet</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => {
                  try {
                    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
                    window.location.href = '/auth/login'
                  } catch {
                    window.location.href = '/auth/login'
                  }
                }}
              >
                Dil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Help next to Profili */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Ndihmë"
                onClick={() => setHelpOpen(true)}
                className="h-9 w-9 rounded-full"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ndihmë</TooltipContent>
          </Tooltip>
          <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
        </div>
      </div>
    </header>
  )
}
