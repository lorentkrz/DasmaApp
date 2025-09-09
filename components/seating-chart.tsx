"use client"

import type React from "react"

import { useEffect, useMemo, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { X, MapPin, Plus, ChevronsUpDown, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

interface Table {
  id: string
  table_number: number
  table_name: string | null
  capacity: number
  table_type: string
  position_x: number
  position_y: number
  notes: string | null
}

interface Guest {
  id: string
  first_name: string
  last_name: string
  plus_one_name: string | null
  table_assignment: string | null
  dietary_restrictions: string | null
  group_id?: string | null
}

interface SeatingChartProps {
  tables: Table[]
  guests: Guest[]
  weddingId: string
  heightClass?: string // Tailwind height class for the canvas container
  onGuestAssigned?: () => void
}

export function SeatingChart({ tables, guests, weddingId, heightClass = "h-[70vh]", onGuestAssigned }: SeatingChartProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedTable, setDraggedTable] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)
  // Zoom & pan state
  const [scale, setScale] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ x: number; y: number } | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Mirror props into local state for instant UI updates (no full refresh required)
  const [internalGuests, setInternalGuests] = useState<Guest[]>(guests)
  const [internalTables, setInternalTables] = useState<Table[]>(tables)
  useEffect(() => setInternalGuests(guests), [guests])
  useEffect(() => setInternalTables(tables), [tables])
  const [seatWholeGroup, setSeatWholeGroup] = useState(false)
  const [showZoomControls, setShowZoomControls] = useState(false)

  // Get guests assigned to a specific table
  const getTableGuests = (tableId: string) => {
    return internalGuests.filter((g) => g.table_assignment === tableId)
  }

  // Assign a guest to a table (used by dropdown quick-assign)
  const assignGuestToTable = async (guestId: string, tableId: string) => {
    const table = internalTables.find((t) => t.id === tableId)
    if (!table) return
    const tableGuests = getTableGuests(tableId)
    if (tableGuests.length >= table.capacity) return
    // Optimistic
    setInternalGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_assignment: tableId } : g)))
    try {
      const { error } = await supabase.from("guests").update({ table_assignment: tableId }).eq("id", guestId)
      if (error) throw error
      onGuestAssigned?.()
    } catch (error) {
      console.error("Error assigning guest to table:", error)
    }
  }

  // Assign unseated members of the selected guest's group to the same table, respecting capacity
  const assignGroupMembersToTable = async (primaryGuestId: string, tableId: string) => {
    const table = internalTables.find((t) => t.id === tableId)
    if (!table) return
    const primary = internalGuests.find((g) => g.id === primaryGuestId)
    if (!primary || !primary.group_id) return
    const currentCount = getTableGuests(tableId).length
    const remaining = Math.max(0, table.capacity - currentCount)
    if (remaining <= 0) return
    const candidates = internalGuests.filter((g) => g.group_id === primary.group_id && !g.table_assignment && g.id !== primaryGuestId)
    if (candidates.length === 0) return
    const toSeat = candidates.slice(0, remaining)
    // Optimistic update
    const ids = toSeat.map((g) => g.id)
    setInternalGuests((prev) => prev.map((g) => (ids.includes(g.id) ? { ...g, table_assignment: tableId } : g)))
    try {
      const { error } = await supabase.from("guests").update({ table_assignment: tableId }).in("id", ids)
      if (error) throw error
      onGuestAssigned?.()
    } catch (error) {
      console.error("Error assigning group members:", error)
    }
  }

  // Handle table drag
  const handleTableDragStart = (e: React.DragEvent, table: Table) => {
    setIsDragging(true)
    setDraggedTable(table.id)
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "table", data: table }))
  }

  const handleTableDragEnd = () => {
    setIsDragging(false)
    setDraggedTable(null)
  }

  // Handle chart drop (for repositioning tables)
  const handleChartDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData("text/plain"))

    if (data.type === "table" && chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect()
      // Convert to content coordinates (inverse pan/scale)
      const rawX = e.clientX - rect.left
      const rawY = e.clientY - rect.top
      let x = (rawX - pan.x) / scale
      let y = (rawY - pan.y) / scale
      // Snap-to-grid (12px)
      const snap = 12
      x = Math.round(x / snap) * snap
      y = Math.round(y / snap) * snap

      // Optimistic local update for smooth UX
      setInternalTables((prev) => prev.map((t) => (t.id === data.data.id ? { ...t, position_x: x, position_y: y } : t)))
      try {
        const { error } = await supabase
          .from("wedding_tables")
          .update({
            position_x: x,
            position_y: y,
          })
          .eq("id", data.data.id)

        if (error) throw error
      } catch (error) {
        console.error("Error updating table position:", error)
      }
    }
  }

  // Handle guest assignment to table
  const handleTableDrop = async (e: React.DragEvent, tableId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const data = JSON.parse(e.dataTransfer.getData("text/plain"))

    if (data.type === "guest") {
      const table = internalTables.find((t) => t.id === tableId)
      const tableGuests = getTableGuests(tableId)

      if (table && tableGuests.length < table.capacity) {
        // Optimistic update
        setInternalGuests((prev) => prev.map((g) => (g.id === data.data.id ? { ...g, table_assignment: tableId } : g)))
        try {
          const { error } = await supabase.from("guests").update({ table_assignment: tableId }).eq("id", data.data.id)
          if (error) throw error
          onGuestAssigned?.()
        } catch (error) {
          console.error("Error assigning guest to table:", error)
        }
      }
    }
  }

  // Remove guest from table
  const handleRemoveGuest = async (guestId: string) => {
    // Optimistic update
    setInternalGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, table_assignment: null } : g)))
    try {
      const { error } = await supabase.from("guests").update({ table_assignment: null }).eq("id", guestId)
      if (error) throw error
      onGuestAssigned?.()
    } catch (error) {
      console.error("Error removing guest from table:", error)
    }
  }

  // Get table color based on occupancy
  const getTableColor = (table: Table) => {
    const tableGuests = getTableGuests(table.id)
    const occupancyRate = tableGuests.length / table.capacity

    if (occupancyRate >= 1) return "border-green-500 bg-green-100"
    if (occupancyRate > 0) return "border-amber-500 bg-amber-100"
    return "border-primary bg-primary/20"
  }

  // Render seat dots around a table
  const renderSeats = (table: Table) => {
    const count = table.capacity
    if (!count || count <= 0) return null
    const assigned = getTableGuests(table.id).length

    // Approximate table size in px (must match shapes below)
    const sizes = {
      round: { w: 80, h: 80 },
      rectangular: { w: 96, h: 64 },
    } as const
    const sz = sizes[(table as any).table_type as keyof typeof sizes] || sizes.round

    const seats = [] as React.ReactNode[]
    
    if (table.table_type === 'rectangular') {
      // Rectangular table: 2 on top, 2 on each side, 2 on bottom
      const positions = [
        // Top side - 2 seats
        { x: sz.w * 0.3, y: -12 },
        { x: sz.w * 0.7, y: -12 },
        // Right side - 2 seats
        { x: sz.w + 12, y: sz.h * 0.3 },
        { x: sz.w + 12, y: sz.h * 0.7 },
        // Bottom side - 2 seats  
        { x: sz.w * 0.7, y: sz.h + 12 },
        { x: sz.w * 0.3, y: sz.h + 12 },
        // Left side - 2 seats
        { x: -12, y: sz.h * 0.7 },
        { x: -12, y: sz.h * 0.3 },
      ]
      
      for (let i = 0; i < Math.min(count, positions.length); i++) {
        const pos = positions[i]
        const filled = i < assigned
        seats.push(
          <div
            key={i}
            className={cn(
              "absolute w-3.5 h-3.5 rounded-full border shadow-sm",
              filled ? "bg-emerald-500 border-emerald-600" : "bg-gray-300 border-gray-400"
            )}
            style={{ left: pos.x, top: pos.y, transform: "translate(-50%, -50%)" }}
            title={filled ? "Occupied" : "Empty"}
          />
        )
      }
    } else {
      // Round and rectangular tables: circular arrangement
      const radius = Math.max(sz.w, sz.h) / 2 + 14
      const center = { x: sz.w / 2, y: sz.h / 2 }

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2
        const x = center.x + radius * Math.cos(angle)
        const y = center.y + radius * Math.sin(angle)
        const filled = i < assigned
        seats.push(
          <div
            key={i}
            className={cn(
              "absolute w-3.5 h-3.5 rounded-full border shadow-sm",
              filled ? "bg-emerald-500 border-emerald-600" : "bg-gray-300 border-gray-400"
            )}
            style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
            title={filled ? "Occupied" : "Empty"}
          />
        )
      }
    }
    
    return (
      <div className="pointer-events-none absolute" style={{ left: 0, top: 0, width: sz.w, height: sz.h }}>
        {seats}
      </div>
    )
  }

  // Render table shape
  const renderTable = (table: Table) => {
    const tableGuests = getTableGuests(table.id)
    const baseClasses = `absolute cursor-pointer border-2 transition-all hover:shadow-lg ${getTableColor(table)} ${
      draggedTable === table.id ? "opacity-50" : ""
    }`

    const tableElement = (() => {
      switch (table.table_type) {
        case "round":
          return (
            <div
              className={cn(baseClasses, "rounded-full w-20 h-20 flex items-center justify-center")}
              style={{ left: table.position_x, top: table.position_y }}
            >
              <div className="text-center">
                <div className="text-sm font-bold">{table.table_number}</div>
                <div className="text-xs">
                  {tableGuests.length}/{table.capacity}
                </div>
              </div>
              {renderSeats(table)}
            </div>
          )
        case "rectangular":
          return (
            <div
              className={cn(baseClasses, "w-24 h-16 flex items-center justify-center")}
              style={{ left: table.position_x, top: table.position_y }}
            >
              <div className="text-center">
                <div className="text-sm font-bold">{table.table_number}</div>
                <div className="text-xs">
                  {tableGuests.length}/{table.capacity}
                </div>
              </div>
              {renderSeats(table)}
            </div>
          )
        default:
          return null
      }
    })()

    const tooltipContent = (
      <div className="text-sm">
        <div className="font-medium mb-1">Table {table.table_number}</div>
        {tableGuests.length === 0 ? (
          <div className="text-muted-foreground">No guests</div>
        ) : (
          <ul className="list-disc pl-4 space-y-0.5">
            {tableGuests.map((g) => (
              <li key={g.id}>
                {g.first_name} {g.last_name}
                {g.plus_one_name ? ` (+ ${g.plus_one_name})` : ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    )

    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              key={table.id}
              draggable
              onDragStart={(e) => handleTableDragStart(e, table)}
              onDragEnd={handleTableDragEnd}
              onDrop={(e) => handleTableDrop(e, table.id)}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => setSelectedTable(table)}
            >
              {tableElement}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltipContent}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <>
      <div
        ref={chartRef}
        className={cn(
          "relative w-full border-2 border-dashed border-border rounded-lg overflow-hidden bg-[radial-gradient(circle,theme(colors.accent/10)_1px,transparent_1px)] [background-size:12px_12px]",
          heightClass
        )}
        onDrop={handleChartDrop}
        onDragOver={(e) => e.preventDefault()}
        onWheel={(e) => {
          // Avoid hijacking page scroll; only zoom with Ctrl+Wheel
          if (e.ctrlKey) {
            e.preventDefault()
            const delta = Math.sign(e.deltaY) * -0.1
            const next = Math.min(2, Math.max(0.5, scale + delta))
            setScale(next)
          }
        }}
        onMouseDown={(e) => {
          // Right or middle click to pan
          if (e.button === 1 || e.button === 2) {
            e.preventDefault()
            setIsPanning(true)
            panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
          }
        }}
        onContextMenu={(e) => {
          // Prevent context menu when using right-click pan
          if (isPanning) e.preventDefault()
        }}
        onMouseMove={(e) => {
          if (isPanning && panStart.current) {
            setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
          }
        }}
        onMouseUp={() => {
          setIsPanning(false)
          panStart.current = null
        }}
        onMouseLeave={() => {
          setIsPanning(false)
          panStart.current = null
        }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "0 0" }}
        >
          {internalTables.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No tables yet</p>
                <p className="text-sm">Add tables to start designing your seating chart</p>
              </div>
            </div>
          ) : (
            internalTables.map(renderTable)
          )}
        </div>

        {isDragging && (
          <div className="pointer-events-none absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center">
            <p className="text-primary font-medium">Drop here to reposition table</p>
          </div>
        )}

        {/* Zoom controls toggle */}
        <div className="absolute bottom-3 left-3">
          <Button 
            size="icon" 
            variant="outline" 
            onClick={() => setShowZoomControls(!showZoomControls)}
            className="bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          {showZoomControls && (
            <div className="flex items-center gap-2 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-md p-1 shadow-sm mt-2">
              <Button size="icon" variant="outline" onClick={() => setScale((s) => Math.max(0.3, s - 0.1))}>
                -
              </Button>
              <div className="px-2 text-xs tabular-nums">{Math.round(scale * 100)}%</div>
              <Button size="icon" variant="outline" onClick={() => setScale((s) => Math.min(3, s + 0.1))}>
                +
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setScale(0.6); setPan({ x: 0, y: 0 }) }}>Fit All</Button>
            </div>
          )}
        </div>
      </div>

      {/* Table Details Dialog */}
      <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              Table {selectedTable?.table_number}
              {selectedTable?.table_name && ` - ${selectedTable.table_name}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTable && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Occupancy</span>
                <Badge variant="outline">
                  {getTableGuests(selectedTable.id).length}/{selectedTable.capacity}
                </Badge>
              </div>
            )}

            <div>
              <div className="text-sm font-medium mb-2">Assigned guests</div>
              <ScrollArea className="h-60">
                <div className="space-y-2 pr-2">
                  {selectedTable &&
                    getTableGuests(selectedTable.id).map((guest) => (
                      <div key={guest.id} className="flex items-center justify-between p-2 bg-accent/50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium">
                            {guest.first_name} {guest.last_name}
                          </div>
                          {guest.plus_one_name && (
                            <div className="text-xs text-muted-foreground">+ {guest.plus_one_name}</div>
                          )}
                          {guest.dietary_restrictions && (
                            <div className="text-xs text-muted-foreground">Dietary: {guest.dietary_restrictions}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveGuest(guest.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {selectedTable && getTableGuests(selectedTable.id).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">No guests assigned</div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {selectedTable?.notes && (
              <div>
                <h4 className="text-sm font-medium mb-1">Notes</h4>
                <p className="text-sm text-muted-foreground">{selectedTable.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
