"use client"

import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SeatingChart } from "@/components/seating-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Plus, Users, Settings, Loader2, Download } from "lucide-react"
import Link from "next/link"

interface Wedding {
  id: string
  bride_name: string
  groom_name: string
  owner_id: string
  created_at: string
}

interface Table {
  id: string
  wedding_id: string
  table_number: number
  table_name: string | null
  table_type: string
  capacity: number
  position_x: number
  position_y: number
  notes: string | null
}

interface Guest {
  id: string
  wedding_id: string
  first_name: string
  last_name: string
  plus_one_name: string | null
  dietary_restrictions: string | null
  rsvp_status: string
  table_assignment: string | null
}

export default function SeatingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [guests, setGuests] = useState<Guest[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createBrowserClient()

      // Check authentication
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/auth/login")
        return
      }

      // Get user's current wedding (owner or collaborator via RLS)
      const { data: weddings } = await supabase
        .from("weddings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)

      if (!weddings || weddings.length === 0) {
        router.push("/dashboard/weddings/new")
        return
      }

      const wedding = weddings[0]
      setCurrentWedding(wedding)

      // Fetch tables and guests
      const [{ data: tablesData }, { data: guestsData }] = await Promise.all([
        supabase.from("wedding_tables").select("*").eq("wedding_id", wedding.id).order("table_number"),
        supabase
          .from("guests")
          .select("*")
          .eq("wedding_id", wedding.id)
          .in("rsvp_status", ["attending", "maybe"])
          .order("last_name"),
      ])

      setTables(tablesData || [])
      setGuests(guestsData || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading seating chart...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!currentWedding) {
    return null
  }

  // Calculate stats
  const totalTables = tables.length
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
  const assignedGuests = guests.filter((g) => g.table_assignment).length
  const unassignedGuests = guests.filter((g) => !g.table_assignment).length

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Seating Chart</h1>
          <p className="text-muted-foreground">
            Design the seating arrangement for {currentWedding.bride_name} & {currentWedding.groom_name}'s wedding
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link href="/dashboard/seating/tables">
              <Settings className="h-4 w-4 mr-2" />
              Manage Tables
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/seating/export">
              <Download className="h-4 w-4 mr-2" />
              Export Seating CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/seating/tables/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Link>
          </Button>

        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTables}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCapacity}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{assignedGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">{unassignedGuests}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {guests
                .filter((g) => !g.table_assignment)
                .map((guest) => (
                  <div
                    key={guest.id}
                    className="p-2 bg-accent/50 rounded-lg border border-dashed border-accent cursor-move hover:bg-accent/70 transition-colors"
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "guest", data: guest }))
                    }}
                  >
                    <div className="text-sm font-medium">
                      {guest.first_name} {guest.last_name}
                    </div>
                    {guest.plus_one_name && (
                      <div className="text-xs text-muted-foreground">+ {guest.plus_one_name}</div>
                    )}
                  </div>
                ))}
              {unassignedGuests === 0 && (
                <div className="text-center text-muted-foreground py-2 text-sm">All guests assigned!</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compact Legend Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full bg-primary/20 border border-primary"></div>
          <span>Round</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-3 bg-primary/20 border border-primary"></div>
          <span>Rectangular</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-primary/20 border border-primary"></div>
          <span>Square</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-emerald-200 border border-emerald-500"></div>
          <span>Full Table</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 bg-amber-200 border border-amber-500"></div>
          <span>Partially Full</span>
        </div>
      </div>

      {/* Seating Chart */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="relative">
          <CardHeader>
            <CardTitle>Seating Arrangement</CardTitle>
            <CardDescription>Drag tables to arrange them and click to assign guests</CardDescription>
          </CardHeader>
          <CardContent>
            <SeatingChart tables={tables} guests={guests} weddingId={currentWedding.id} heightClass="h-[78vh]" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
