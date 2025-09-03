"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SeatingChart } from "@/components/seating-chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, MapPin, Plus, Edit, Trash2, Search, Filter, UserCheck, UserX, Clock, Baby, Loader2, Download, Heart, Sparkles, Armchair, Settings } from "lucide-react"
import Link from "next/link"
import { BeautifulPDFExport } from "@/components/beautiful-pdf-export"
import { AISeatingsuggestions } from "@/components/ai-seating-suggestions"
import { RealTimeCollaboration } from "@/components/real-time-collaboration"

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
  const [loading, setLoading] = useState(true)
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [guests, setGuests] = useState<Guest[]>([])

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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            <span className="text-lg font-medium text-gray-700">Duke ngarkuar planin e uljes...</span>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-200/20 to-slate-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-200/15 to-stone-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center shadow-lg">
                <Armchair className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Plani i Uljes
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-lg">
                Dizajnoni rregullimin e uljes për dasmën e {currentWedding.bride_name} & {currentWedding.groom_name}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm hover:bg-white border-purple-200 rounded-xl">
              <Link href="/dashboard/seating/tables">
                <Settings className="h-4 w-4 mr-2" />
                Menaxho Tavolinat
              </Link>
            </Button>
            <Button variant="outline" asChild className="bg-white/80 backdrop-blur-sm hover:bg-white border-indigo-200 rounded-xl">
              <Link href="/dashboard/seating/export">
                <Download className="h-4 w-4 mr-2" />
                Eksporto CSV
              </Link>
            </Button>
            <BeautifulPDFExport 
              tables={tables} 
              guests={guests} 
              weddingName={`${currentWedding.bride_name} & ${currentWedding.groom_name}`}
            />
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <Link href="/dashboard/seating/tables/new">
                <Plus className="h-5 w-5 mr-2" />
                Shto Tavolinë
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-indigo-700">Tavolinat</CardTitle>
              <MapPin className="h-5 w-5 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-800">{totalTables}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-0 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-purple-700">Kapaciteti Total</CardTitle>
              <Users className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{totalCapacity}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-green-700">Të Caktuar</CardTitle>
              <Users className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{assignedGuests}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-0 shadow-xl rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-bold text-amber-700">Pa Caktuar</CardTitle>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">{unassignedGuests}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {guests
                  .filter((g) => !g.table_assignment)
                  .map((guest) => (
                    <div
                      key={guest.id}
                      className="p-3 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-xl border border-amber-200 cursor-move hover:from-amber-200 hover:to-yellow-200 transition-all shadow-sm"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", JSON.stringify({ type: "guest", data: guest }))
                      }}
                    >
                      <div className="text-sm font-bold text-amber-800">
                        {guest.first_name} {guest.last_name}
                      </div>
                      {guest.plus_one_name && (
                        <div className="text-xs text-amber-600">+ {guest.plus_one_name}</div>
                      )}
                    </div>
                  ))}
                {unassignedGuests === 0 && (
                  <div className="text-center text-amber-600 py-3 text-sm font-medium">
                    Të gjithë mysafirët janë caktuar!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Legend Bar */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-200 to-indigo-200 border-2 border-blue-400 rounded-full"></div>
              <span className="font-medium text-gray-700">Rreth</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-gradient-to-r from-purple-200 to-violet-200 border-2 border-purple-400 rounded-sm"></div>
              <span className="font-medium text-gray-700">Drejtkëndore</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-emerald-200 to-green-200 border-2 border-emerald-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Tavolinë e Plotë</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-amber-200 to-yellow-200 border-2 border-amber-500 rounded-full"></div>
              <span className="font-medium text-gray-700">Pjesërisht e Plotë</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-gray-400" />
              <span className="font-medium text-gray-700">Eksporto PDF</span>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="mb-6">
          <AISeatingsuggestions 
            guests={guests} 
            tables={tables} 
            weddingId={currentWedding.id}
            onSuggestionsApplied={() => window.location.reload()}
          />
        </div>

        {/* Enhanced Seating Chart */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-100 via-indigo-50 to-pink-100 py-8">
              <div className="flex items-center gap-3">
                <Armchair className="h-8 w-8 text-purple-600" />
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Rregullimi i Uljes</CardTitle>
                  <CardDescription className="text-gray-600 text-lg mt-1">
                    Tërhiqni tavolinat për t'i rregulluar dhe klikoni për të caktuar mysafirët
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <SeatingChart tables={tables} guests={guests} weddingId={currentWedding.id} heightClass="h-[78vh]" />
            </CardContent>
          </Card>
        </div>

        {/* Real-time Collaboration */}
        <RealTimeCollaboration weddingId={currentWedding.id} currentPage="seating" />
      </div>
    </div>
  )
}
