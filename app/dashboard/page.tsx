import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  Calendar, 
  DollarSign, 
  CheckSquare, 
  MapPin, 
  Mail, 
  Heart, 
  Plus, 
  TrendingUp, 
  Clock,
  Target,
  Sparkles,
  MessageCircle,
  Gift,
  Zap,
  BarChart3,
  CheckCircle,
  ArrowRight,
  AlertCircle,
  Utensils
} from "lucide-react"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })

  if (!weddings || weddings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-200/20 to-slate-200/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-200/15 to-stone-200/15 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-slate-300/30 rounded-full blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative container mx-auto px-6 py-12">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center shadow-2xl">
                  <Calendar className="h-12 w-12 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-slate-700 via-gray-700 to-slate-600 bg-clip-text text-transparent">
              Mirësevini në Planifikuesin e Dasmës
            </h1>
            <p className="text-2xl text-gray-700 mb-8 leading-relaxed">
              Filloni udhëtimin tuaj drejt dasmës së ëndrrave! Organizoni gjithçka në mënyrë të lehtë dhe të bukur.
            </p>
            <Button asChild size="lg" className="text-xl px-12 py-6 rounded-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-2xl transform hover:scale-105 transition-all duration-300">
              <Link href="/dashboard/weddings/new">
                Krijoni Dasmën Tuaj të Parë
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentWedding = weddings[0]

  const [
    { data: kpisRows },
    { data: activity },
    { data: guests },
    { data: tasks },
  ] = await Promise.all([
    supabase.from("dashboard_kpis").select("*").eq("wedding_id", currentWedding.id).limit(1),
    supabase.from("dashboard_last_activity_recent").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("guests").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("tasks").select("*").eq("wedding_id", currentWedding.id),
  ])
  const kpis = Array.isArray(kpisRows) && kpisRows.length > 0 ? kpisRows[0] : null

  const guestStats = {
    total: guests?.length || 0,
    confirmed: guests?.filter((g) => g.rsvp_status === "attending").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
  }

  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter((t) => t.completed).length || 0,
    overdue: tasks?.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length || 0,
  }

  // Note: KPIs/budget/vendor stats now sourced in AnalyticsDashboard via view

  const daysUntilWedding = Math.ceil(
    (new Date(currentWedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-40 h-40 bg-slate-200/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-16 w-32 h-32 bg-gray-200/20 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-36 h-36 bg-stone-200/18 rounded-full blur-3xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-60 right-1/3 w-28 h-28 bg-slate-300/25 rounded-full blur-xl animate-pulse delay-500"></div>
      </div>
      
      <div className="relative container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Enhanced Header - Mobile Responsive */}
        <div className="flex flex-col space-y-6 mb-8 md:mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-700 via-gray-700 to-slate-600 bg-clip-text text-transparent">
                {currentWedding.bride_name} & {currentWedding.groom_name}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-gray-600">
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-2 md:px-4 md:py-2 shadow-md">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-slate-500" />
                <span className="font-semibold text-sm md:text-base">{new Date(currentWedding.wedding_date).toLocaleDateString('sq-AL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-3 py-2 md:px-4 md:py-2 shadow-md">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                <Badge 
                  variant={daysUntilWedding > 30 ? "secondary" : daysUntilWedding > 7 ? "default" : "destructive"}
                  className="text-sm md:text-lg px-3 py-1 md:px-4 md:py-2 rounded-full font-bold shadow-lg"
                >
                  {daysUntilWedding > 0 ? `${daysUntilWedding} ditë të mbetura` : "Sot është Dita Juaj e Madhe!"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6 md:mt-0">
            {weddings.length > 1 && (
              <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50" size="sm" asChild>
                <Link href="/dashboard/weddings">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ndrysho Dasmën
                </Link>
              </Button>
            )}
            <Button asChild className="rounded-xl bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 shadow-lg transform hover:scale-105 transition-all duration-200">
              <Link href="/dashboard/weddings/new">
                <Plus className="h-4 w-4 mr-2" />
                Krijo Dasmë të Re
              </Link>
            </Button>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="mb-8">
          <AnalyticsDashboard 
            kpis={kpis}
            activity={activity || []}
          />
        </div>

        {/* Enhanced Quick Actions - Wedding Themed */}
        <div className="space-y-6 mb-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Menaxhoni Dasmën Tuaj
            </h2>
            <p className="text-gray-600 text-lg">Gjithçka që ju nevojitet për dasmën e përkryer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Priority Actions */}
            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-blue-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/guests">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Lista e Mysafirëve</CardTitle>
                  <CardDescription className="text-gray-600">Menaxhoni të ftuarit dhe përgjigjet e tyre</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/invitations">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Ftesat</CardTitle>
                  <CardDescription className="text-gray-600">Dërgoni ftesa dhe ndiqni përgjigjet</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-stone-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/budget">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-stone-600 to-slate-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Buxheti</CardTitle>
                  <CardDescription className="text-gray-600">Kontrolloni shpenzimet dhe planifikoni buxhetin</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-gray-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/vendors">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-600 to-slate-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Utensils className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Contracts</CardTitle>
                  <CardDescription className="text-gray-600">Rezervoni dhe menaxhoni kontratat</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-slate-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/seating">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <MapPin className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Plani i Uljeve</CardTitle>
                  <CardDescription className="text-gray-600">Organizoni vendet për mysafirët</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="rounded-2xl border-0 shadow-xl bg-gradient-to-br from-white/90 to-stone-50/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer group">
              <Link href="/dashboard/tasks">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-r from-stone-600 to-slate-700 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-stone-500 group-hover:translate-x-1 transition-all" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800">Lista e Punëve</CardTitle>
                  <CardDescription className="text-gray-600">Ndiqni përparimin e detyrave tuaja</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>

        {/* Enhanced Recent Activity */}
        <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-slate-100/50 to-gray-100/50 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Gjendja Aktuale</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  {taskStats.completed} nga {taskStats.total} detyra të përfunduara
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {taskStats.overdue > 0 && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-rose-400 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-red-700 text-lg">Detyra të Vonuara</p>
                    <p className="text-red-600">
                      Keni {taskStats.overdue} detyrë{taskStats.overdue > 1 ? " të vonuara" : " të vonuar"} që duhen përfunduar
                    </p>
                  </div>
                </div>
              )}

              {guestStats.pending > 0 && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-200/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-amber-700 text-lg">Në Pritje të Përgjigjes</p>
                    <p className="text-amber-600">
                      {guestStats.pending} mysafir{guestStats.pending > 1 ? "ë" : ""} ende nuk kanë dhënë përgjigje për ftesën
                    </p>
                  </div>
                </div>
              )}

              {taskStats.overdue === 0 && guestStats.pending === 0 && (
                <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200/50">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-700 text-lg">Gjithçka në Rregull!</p>
                    <p className="text-emerald-600">
                      Nuk ka detyra të vonuara apo përgjigje të papërgjigjura. Vazhdoni punën e shkëlqyer!
                    </p>
                  </div>
                </div>
              )}

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
