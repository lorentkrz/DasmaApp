"use client"

import * as React from "react"
import { StandardTableEnhanced } from "@/components/standard-table-enhanced"

export type Guest = {
  id: string
  first_name?: string
  last_name?: string
  plus_one_name?: string
  rsvp_status?: string
  phone?: string
  email?: string
}

export function RecentGuestsTable({ data }: { data: Guest[] }) {
  const columns = React.useMemo(() => [
    {
      key: "name",
      header: "Emri",
      sortable: true,
      accessor: (g: Guest) => {
        const initials = `${(g.first_name || "")[0] || "?"}${(g.last_name || "")[0] || ""}`.toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-full bg-[var(--card-bg)] dark:bg-[var(--card-bg-dark)] border border-[var(--border-2025)] dark:border-[var(--border-dark)] flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            <div className="truncate">
              <div className="font-medium truncate">{g.first_name} {g.last_name}</div>
              {g.plus_one_name && (
                <div className="text-xs text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] truncate">+ {g.plus_one_name}</div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: "rsvp_status",
      header: "RSVP",
      sortable: true,
      accessor: (g: Guest) => {
        const map: Record<string, { label: string; cls: string }> = {
          attending: { label: "Vjen", cls: "bg-green-100 text-green-800" },
          declined: { label: "S'vjen", cls: "bg-red-100 text-red-800" },
          pending: { label: "Në pritje", cls: "bg-yellow-100 text-yellow-800" },
        }
        const cfg = map[g.rsvp_status || ""] || { label: g.rsvp_status || "-", cls: "bg-gray-100 text-gray-800" }
        return <span className={`px-2 py-0.5 rounded text-xs ${cfg.cls}`}>{cfg.label}</span>
      }
    },
    {
      key: "phone",
      header: "Kontakti",
      accessor: (g: Guest) => (
        <div className="text-sm text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)] truncate">
          {g.phone || g.email || "–"}
        </div>
      )
    },
  ], [])

  return (
    <StandardTableEnhanced
      data={data as any}
      columns={columns as any}
      emptyMessage="Nuk ka mysafirë"
      withFilters={false}
      scrollContainerClassName="max-h-[256px] overflow-auto"
      className="space-y-0"
    />
  )
}
