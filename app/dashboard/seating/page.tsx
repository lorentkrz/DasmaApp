"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SeatingChart } from "@/components/seating-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Download, Armchair, MapPin, X, Loader2, Settings } from "lucide-react"
import Link from "next/link"
import { BeautifulPDFExport } from "@/components/beautiful-pdf-export"
import { TableCardsExport } from "@/components/table-cards-export"

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
  guest_type: string
}

export default function SeatingPage() {
  const router = useRouter()
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [tables, setTables] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

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
      setWedding(weddings[0])

      // Fetch tables and ONLY attending guests
      const [{ data: tablesData }, { data: guestsData }] = await Promise.all([
        supabase.from("wedding_tables").select("*").eq("wedding_id", wedding.id).order("table_number"),
        supabase
          .from("guests")
          .select("*")
          .eq("wedding_id", wedding.id)
          .eq("rsvp_status", "attending")
          .order("last_name"),
      ])

      console.log('Tables:', tablesData)
      console.log('Attending guests:', guestsData)

      setTables(tablesData || [])
      setGuests(guestsData || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-6 py-4 border">
            <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
            <span className="text-gray-700">Duke ngarkuar planin e uljes...</span>
          </div>
        </div>
      </div>
    )
  }

  if (!wedding) {
    return null
  }

  // Calculate stats
  const totalTables = tables.length
  const totalCapacity = tables.reduce((sum, table) => sum + table.capacity, 0)
  const assignedGuests = guests.filter((g) => g.table_assignment).length
  const unassignedGuests = guests.filter((g) => !g.table_assignment).length

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Armchair className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Plani i Uljes
              </h1>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-2 border">
              <p className="text-gray-700 text-sm">
                Menaxhoni rregullimin e uljes për dasmën tuaj
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mt-6 md:mt-0">
            <Button variant="outline" asChild>
              <Link href="/dashboard/seating/tables">
                <Settings className="h-4 w-4 mr-2" />
                Menaxho Tavolinat
              </Link>
            </Button>
            <TableCardsExport 
              tables={tables} 
              guests={guests} 
              weddingName={`${wedding.bride_name} & ${wedding.groom_name}`}
            />
            <BeautifulPDFExport 
              tables={tables} 
              guests={guests} 
              weddingName={`${wedding.bride_name} & ${wedding.groom_name}`}
            />
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/dashboard/seating/tables/new">
                <Plus className="h-4 w-4 mr-2" />
                Shto Tavolinë
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Tavolinat</CardTitle>
              <MapPin className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{totalTables}</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Kapaciteti Total</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{totalCapacity}</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Të Caktuar</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-green-600">{assignedGuests}</div>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Pa Caktuar</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-amber-600">{unassignedGuests}</div>
              {unassignedGuests === 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Të gjithë mysafirët janë caktuar!
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Legend Bar */}
        <div className="mb-6 bg-gray-50 rounded-lg p-4 border">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-400 rounded-full"></div>
              <span className="text-gray-700">Rreth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-purple-100 border-2 border-purple-400 rounded-sm"></div>
              <span className="text-gray-700">Drejtkëndore</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-500 rounded-full"></div>
              <span className="text-gray-700">Tavolinë e Plotë</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-500 rounded-full"></div>
              <span className="text-gray-700">Pjesërisht e Plotë</span>
            </div>
          </div>
        </div>

        {/* Seating Chart with Sidebar */}
        <div className="flex gap-4">
          {/* Collapsible Unassigned Guests Sidebar */}
          <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-12'} flex-shrink-0`}>
            <div className="sticky top-4">
              <Card className="border h-[calc(100vh-12rem)]">
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    {sidebarOpen && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-600" />
                        <div>
                          <CardTitle className="text-sm font-medium text-gray-900">
                            Pa Caktuar ({unassignedGuests})
                          </CardTitle>
                        </div>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="h-8 w-8 p-0"
                    >
                      {sidebarOpen ? <X className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {sidebarOpen && (
                  <CardContent className="p-3 overflow-y-auto">
                    <div className="space-y-2">
                      {guests
                        .filter((g) => !g.table_assignment)
                        .map((guest) => (
                          <div
                            key={guest.id}
                            className="p-2 bg-yellow-50 rounded-lg border border-yellow-200 cursor-move hover:bg-yellow-100 transition-colors"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", JSON.stringify({ type: "guest", data: guest }))
                            }}
                          >
                            <div className="text-xs font-medium text-gray-900 truncate">
                              {guest.first_name} {guest.last_name}
                            </div>
                            {guest.plus_one_name && (
                              <div className="text-xs text-gray-600 truncate">+ {guest.plus_one_name}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </div>

          {/* Seating Chart */}
          <div className="flex-1">
            <Card className="border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Armchair className="h-6 w-6 text-gray-600" />
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">Rregullimi i Uljes</CardTitle>
                    <CardDescription className="text-gray-600 mt-1">
                      Tërhiqni tavolinat për t'i rregulluar dhe klikoni për të caktuar mysafirët
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  <SeatingChart 
                    tables={tables} 
                    guests={guests} 
                    weddingId={wedding.id} 
                    heightClass="h-[60vh]"
                    onGuestAssigned={() => {
                      // Refresh data without full page reload
                      const supabase = createClient()
                      supabase
                        .from("guests")
                        .select("*")
                        .eq("wedding_id", wedding.id)
                        .eq("rsvp_status", "attending")
                        .order("last_name")
                        .then(({ data }) => {
                          if (data) setGuests(data)
                        })
                    }}
                  />
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
