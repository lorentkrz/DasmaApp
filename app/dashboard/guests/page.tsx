import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import GuestList from "@/components/guest-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, CheckCircle, Clock, X, Download, Upload, UserCheck } from "lucide-react"
import Link from "next/link"

export default async function GuestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get accessible wedding (RLS enforces access) with debug info
  const { data: weddings, error: weddingsError } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  console.log("User:", user?.id)
  console.log("Weddings data:", weddings)
  console.log("Weddings error:", weddingsError)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all guests for the current wedding with invitation data
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select(`
      *,
      invitations(id, token, sent_at, opened_at, responded_at)
    `)
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Test RLS access - check if user can access the wedding
  const { data: testWedding, error: testWeddingError } = await supabase
    .from("weddings")
    .select("id, owner_id")
    .eq("id", currentWedding.id)
    .single()

  console.log("=== RLS DEBUG ===")
  console.log("User ID:", user.id)
  console.log("Wedding owner_id:", testWedding?.owner_id)
  console.log("User owns wedding:", user.id === testWedding?.owner_id)
  console.log("Wedding access error:", testWeddingError)
  console.log("Guests query error:", guestsError)
  console.log("Guests data:", guests)
  console.log("=== END DEBUG ===")

  // Calculate stats (handle both plus_one_allowed and plus_one column names)
  const stats = {
    total: guests?.length || 0,
    attending: guests?.filter((g) => g.rsvp_status === "attending").length || 0,
    notAttending: guests?.filter((g) => g.rsvp_status === "not_attending").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
    maybe: guests?.filter((g) => g.rsvp_status === "maybe").length || 0,
    plusOnes: guests?.filter((g) => g.plus_one_allowed && g.plus_one_name).length || 0,
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                <UserCheck className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Menaxhimi i Të Ftuarve
              </h1>
            </div>
            <div className="bg-gray-50 rounded-lg px-4 py-2 border">
              <p className="text-gray-700 text-sm">
                Lista e të ftuarve për dasmën e <span className="font-medium">{currentWedding.bride_name}</span> & <span className="font-medium">{currentWedding.groom_name}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/guests/import">
                <Upload className="h-4 w-4 mr-2" />
                Importo Lista
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/guests/export">
                <Download className="h-4 w-4 mr-2" />
                Eksporto Lista
              </Link>
            </Button>
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/dashboard/guests/new">
                <UserPlus className="h-4 w-4 mr-2" />
                Shto Të Ftuar të Ri
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Totali i Të Ftuarve</CardTitle>
              <div className="w-6 h-6 bg-gray-100 rounded-md flex items-center justify-center border">
                <Users className="h-3 w-3 text-gray-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">mysafirë të ftuar</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Pranojnë</CardTitle>
              <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center border border-green-200">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-green-700">{stats.attending}</div>
              <p className="text-xs text-green-600 mt-1">do të marrin pjesë</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Në Pritje</CardTitle>
              <div className="w-6 h-6 bg-amber-100 rounded-md flex items-center justify-center border border-amber-200">
                <Clock className="h-3 w-3 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-amber-700">{stats.pending}</div>
              <p className="text-xs text-amber-600 mt-1">pa përgjigje</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Ndoshta</CardTitle>
              <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center border border-blue-200">
                <Clock className="h-3 w-3 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-blue-700">{stats.maybe}</div>
              <p className="text-xs text-blue-600 mt-1">të pasigurt</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Nuk Pranojnë</CardTitle>
              <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center border border-red-200">
                <X className="h-3 w-3 text-red-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-red-700">{stats.notAttending}</div>
              <p className="text-xs text-red-600 mt-1">nuk do të marrin pjesë</p>
            </CardContent>
          </Card>

          <Card className="border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-gray-600">Shoqërues</CardTitle>
              <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center border border-purple-200">
                <Users className="h-3 w-3 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-semibold text-purple-700">{stats.plusOnes}</div>
              <p className="text-xs text-purple-600 mt-1">me shoqërues</p>
            </CardContent>
          </Card>
        </div>

        {/* Guest List */}
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Users className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-gray-900">Lista e Të Ftuarve</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  Menaxhoni të ftuarit e dasmës dhe gjurmoni statusin e tyre për RSVP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {guestsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-red-700 text-sm">Error loading guests: {guestsError.message}</p>
              </div>
            )}
            {!guests || guests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No guests found. Add your first guest to get started.</p>
                <p className="text-xs text-gray-400 mt-1">Wedding ID: {currentWedding.id}</p>
              </div>
            ) : (
              <GuestList guests={guests} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
