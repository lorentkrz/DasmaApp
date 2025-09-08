"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Column<T> {
  key: string
  header: string
  accessor: (item: T) => React.ReactNode
  className?: string
  sortable?: boolean
}

interface StandardTableProps<T> {
  data: T[]
  columns: Column<T>[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
  pagination?: {
    page: number
    pageSize: number
    total: number
    onPageChange: (page: number) => void
    onPageSizeChange: (size: number) => void
  }
  loading?: boolean
  compact?: boolean
}

export function StandardTable<T extends { id: string }>({
  data,
  columns,
  onRowClick,
  emptyMessage = "No data available",
  className,
  pagination,
  loading = false,
  compact = false,
}: StandardTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data
    
    return [...data].sort((a, b) => {
      const aVal = columns.find(c => c.key === sortKey)?.accessor(a)
      const bVal = columns.find(c => c.key === sortKey)?.accessor(b)
      
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      
      const comparison = aVal < bVal ? -1 : 1
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [data, sortKey, sortDirection, columns])

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 1
  const startItem = pagination ? (pagination.page - 1) * pagination.pageSize + 1 : 1
  const endItem = pagination ? Math.min(pagination.page * pagination.pageSize, pagination.total) : data.length

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-medium text-gray-700",
                    compact ? "py-2 px-3 text-xs" : "py-3 px-4 text-sm",
                    column.className,
                    column.sortable && "cursor-pointer select-none hover:bg-gray-100/50"
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && sortKey === column.key && (
                      <span className="text-gray-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    Loading...
                  </div>
                </TableCell>
              </TableRow>
            ) : sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8">
                  <p className="text-gray-500">{emptyMessage}</p>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        compact ? "py-2 px-3 text-xs" : "py-3 px-4 text-sm",
                        column.className
                      )}
                    >
                      {column.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Items per page:</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={(value) => {
                  pagination.onPageSizeChange(parseInt(value))
                  pagination.onPageChange(1)
                }}
              >
                <SelectTrigger className="h-8 w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              Showing {startItem} to {endItem} of {pagination.total}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.page === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 px-2">
              Page {pagination.page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(totalPages)}
              disabled={pagination.page === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
