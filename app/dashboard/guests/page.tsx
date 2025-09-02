import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuestList } from "@/components/guest-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, CheckCircle, Clock, X, Download, Upload, Heart, Sparkles, UserCheck } from "lucide-react"
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

  // Get accessible wedding (RLS enforces access)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all guests for the current wedding
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", currentWedding.id)
    .order("last_name", { ascending: true })

  // Calculate stats
  const stats = {
    total: guests?.length || 0,
    attending: guests?.filter((g) => g.rsvp_status === "attending").length || 0,
    notAttending: guests?.filter((g) => g.rsvp_status === "not_attending").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
    maybe: guests?.filter((g) => g.rsvp_status === "maybe").length || 0,
    plusOnes: guests?.filter((g) => g.plus_one_allowed && g.plus_one_name).length || 0,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                Menaxhimi i Të Ftuarve
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-lg">
                Lista e të ftuarve për dasmën e <span className="font-bold text-rose-600">{currentWedding.bride_name}</span> & <span className="font-bold text-rose-600">{currentWedding.groom_name}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            <Button asChild variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-all shadow-lg">
              <Link href="/dashboard/guests/import">
                <Upload className="h-5 w-5 mr-2 text-rose-500" />
                Importo Lista
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white/80 backdrop-blur-sm border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-lg">
              <Link href="/dashboard/guests/export">
                <Download className="h-5 w-5 mr-2 text-amber-500" />
                Eksporto Lista
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <Link href="/dashboard/guests/new">
                <UserPlus className="h-5 w-5 mr-2" />
                Shto Të Ftuar të Ri
              </Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-gray-100/50 to-slate-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-gray-700">Totali i Të Ftuarve</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-gray-800">{stats.total}</div>
              <p className="text-xs text-gray-600 mt-1">mysafirë të ftuar</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-emerald-100/50 to-green-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-emerald-700">Pranojnë</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-emerald-600">{stats.attending}</div>
              <p className="text-xs text-emerald-600 mt-1">do të marrin pjesë</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-amber-100/50 to-yellow-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-amber-700">Në Pritje</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
              <p className="text-xs text-amber-600 mt-1">pa përgjigje</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-blue-700">Ndoshta</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-600">{stats.maybe}</div>
              <p className="text-xs text-blue-600 mt-1">të pasigurt</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-red-100/50 to-rose-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-red-700">Nuk Pranojnë</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-rose-400 rounded-full flex items-center justify-center">
                <X className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-red-600">{stats.notAttending}</div>
              <p className="text-xs text-red-600 mt-1">nuk do të marrin pjesë</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-t-2xl">
              <CardTitle className="text-sm font-bold text-purple-700">Shoqërues</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-600">{stats.plusOnes}</div>
              <p className="text-xs text-purple-600 mt-1">me shoqërues</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Guest List */}
        <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-rose-100/50 to-pink-100/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Lista e Të Ftuarve</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Menaxhoni të ftuarit e dasmës dhe gjurmoni statusin e tyre për RSVP
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <GuestList guests={guests || []} weddingId={currentWedding.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
