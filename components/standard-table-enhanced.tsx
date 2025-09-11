"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { motion, AnimatePresence } from "framer-motion"

export type EnhancedColumn<T> = {
  key: keyof T & string
  header: string
  accessor?: (item: T) => React.ReactNode
  className?: string
  sortable?: boolean
  editable?: boolean
  renderEdit?: (value: any, onChange: (v: any) => void) => React.ReactNode
}

export type StandardTableEnhancedProps<T> = {
  data: T[]
  columns: EnhancedColumn<T>[]
  emptyMessage?: string
  className?: string
  onRowClick?: (row: T) => void
  onRowEdit?: (row: T, key: string, value: any) => void
  loading?: boolean
  withFilters?: boolean
  scrollContainerClassName?: string
  filterKeys?: string[]
}

export function StandardTableEnhanced<T extends { id: string }>({
  data,
  columns,
  emptyMessage = "Nuk ka të dhëna",
  className,
  onRowClick,
  onRowEdit,
  loading,
  withFilters = true,
  scrollContainerClassName,
  filterKeys,
}: StandardTableEnhancedProps<T>) {
  const [filters, setFilters] = React.useState<Record<string, string>>({})
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")
  const [editing, setEditing] = React.useState<{ id: string; key: string } | null>(null)

  const getColumnForKey = (key: string) => columns.find((c) => c.key === key)

  const valueFor = (row: any, key: string): string => {
    const col = getColumnForKey(key)
    if (col?.accessor) {
      const v = col.accessor(row)
      return typeof v === 'string' ? v : (v as any)?.props?.children?.toString?.() ?? ''
    }
    // special-case combined name
    if (key === 'name') {
      const first = (row as any).first_name ?? ''
      const last = (row as any).last_name ?? ''
      return `${first} ${last}`.trim()
    }
    const raw = (row as any)[key]
    return String(raw ?? '')
  }

  const filtered = React.useMemo(() => {
    const activeKeys = Object.keys(filters).filter((k) => filters[k]?.trim())
    if (activeKeys.length === 0) return data
    return data.filter((row) =>
      activeKeys.every((k) => valueFor(row, k).toLowerCase().includes(filters[k].toLowerCase()))
    )
  }, [data, filters])

  const sorted = React.useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]
      if (aVal === bVal) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal < bVal ? -1 : 1
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDirection])

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const startEdit = (rowId: string, key: string) => setEditing({ id: rowId, key })
  const stopEdit = () => setEditing(null)

  return (
    <div className={cn("space-y-3", className)}>
      {withFilters && (
        <AnimatePresence initial={false}>
          <motion.div
            className="glass rounded-md border border-white/10 dark:border-white/10 p-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.2, 0.9, 0.27, 1] }}
          >
            <div className="flex flex-wrap items-center gap-2">
              {(filterKeys && filterKeys.length > 0 ? filterKeys : columns.map(c => c.key)).map((key) => {
                const col = getColumnForKey(key)
                if (!col) return null
                return (
                  <Input
                    key={key}
                    placeholder={`Filtro ${col.header}`}
                    value={filters[key] || ""}
                    onChange={(e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="h-8 text-[13px] px-2 bg-white/30 dark:bg-slate-900/20 border-white/20 dark:border-white/10 placeholder:text-[color:var(--muted-2025)] max-w-[200px]"
                  />
                )
              })}
              {Object.keys(filters).length > 0 && (
                <button
                  type="button"
                  className="text-xs ml-auto px-2 py-1 rounded border border-white/20 hover:bg-white/20 dark:hover:bg-slate-900/20"
                  onClick={() => setFilters({})}
                >
                  Pastro filtrat
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      <div className="glass rounded-lg border border-white/10 dark:border-white/10 overflow-hidden">
        <div className={cn(scrollContainerClassName)}>
        <Table className="density-table min-w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-[var(--sidebar-bg)] dark:bg-[var(--sidebar-bg-dark)] border-b border-[var(--border-2025)] dark:border-[var(--border-dark)]">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  onClick={() => c.sortable && handleSort(c.key)}
                  className={cn(
                    "font-medium text-[var(--text-heading)] dark:text-[var(--text-heading-dark)] select-none",
                    c.sortable && "cursor-pointer hover:bg-[var(--card-bg)] dark:hover:bg-[var(--card-bg-dark)]",
                    c.className
                  )}
                >
                  <div className="flex items-center gap-1">
                    {c.header}
                    {c.sortable && sortKey === c.key && (
                      <span className="text-xs opacity-70">{sortDirection === "asc" ? "↑" : "↓"}</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-gray-600">
                  Duke u ngarkuar…
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-sm text-gray-600">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn("transition-colors hover:bg-[var(--card-bg)] dark:hover:bg-[var(--card-bg-dark)]", onRowClick && "cursor-pointer")}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => {
                    const isEditing = editing && editing.id === row.id && editing.key === c.key
                    const raw = (row as any)[c.key]
                    return (
                      <TableCell key={c.key} className={cn(c.className)}>
                        {c.editable ? (
                          isEditing ? (
                            <div onClick={(e) => e.stopPropagation()}>
                              {c.renderEdit ? (
                                c.renderEdit(raw, (v) => onRowEdit?.(row, c.key, v))
                              ) : (
                                <Input
                                  autoFocus
                                  defaultValue={raw ?? ""}
                                  onBlur={(e) => {
                                    onRowEdit?.(row, c.key, e.target.value)
                                    stopEdit()
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      const target = e.target as HTMLInputElement
                                      onRowEdit?.(row, c.key, target.value)
                                      stopEdit()
                                    } else if (e.key === "Escape") {
                                      stopEdit()
                                    }
                                  }}
                                  className="h-8"
                                />
                              )}
                            </div>
                          ) : (
                            <div
                              onClick={(e) => {
                                e.stopPropagation()
                                startEdit(row.id, c.key)
                              }}
                              className="group"
                            >
                              <div className="truncate group-hover:underline/50">
                                {c.accessor ? c.accessor(row) : String(raw ?? "–")}
                              </div>
                            </div>
                          )
                        ) : c.accessor ? (
                          c.accessor(row)
                        ) : (
                          <div className="truncate">{String(raw ?? "–")}</div>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  )
}
