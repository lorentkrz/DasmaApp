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
  Plus, 
  TrendingUp, 
  Clock,
  Target,
  MessageCircle,
  Gift,
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
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Calendar className="h-8 w-8 text-gray-600" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold mb-4 text-gray-900">
              Mirësevini në Planifikuesin e Dasmës
            </h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Filloni udhëtimin tuaj drejt dasmës së ëndrrave! Organizoni gjithçka në mënyrë të lehtë dhe të bukur.
            </p>
            <Button asChild size="lg" className="bg-gray-900 hover:bg-gray-800 text-white">
              <Link href="/dashboard/weddings/new">
                <Plus className="h-4 w-4 mr-2" />
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
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Calendar className="h-5 w-5 text-gray-600" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {currentWedding.bride_name} & {currentWedding.groom_name}
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-600">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">{new Date(currentWedding.wedding_date).toLocaleDateString('sq-AL', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <Badge 
                  variant={daysUntilWedding > 30 ? "secondary" : daysUntilWedding > 7 ? "default" : "destructive"}
                  className="text-sm font-medium"
                >
                  {daysUntilWedding > 0 ? `${daysUntilWedding} ditë të mbetura` : "Sot është Dita Juaj e Madhe!"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            {weddings.length > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/weddings">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ndrysho Dasmën
                </Link>
              </Button>
            )}
            <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white">
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

        {/* Quick Actions */}
        <div className="space-y-4 mb-8">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Menaxhoni Dasmën Tuaj
            </h2>
            <p className="text-gray-600 text-sm">Gjithçka që ju nevojitet për dasmën e përkryer</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/guests">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <Users className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Lista e Mysafirëve</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Menaxhoni të ftuarit dhe përgjigjet e tyre</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/invitations">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <Mail className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Ftesat</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Dërgoni ftesa dhe ndiqni përgjigjet</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/budget">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <DollarSign className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Buxheti</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Kontrolloni shpenzimet dhe planifikoni buxhetin</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/vendors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <Utensils className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Contracts</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Rezervoni dhe menaxhoni kontratat</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/seating">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <MapPin className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Plani i Uljeve</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Organizoni vendet për mysafirët</CardDescription>
                </CardHeader>
              </Link>
            </Card>

            <Card className="border hover:shadow-md transition-shadow cursor-pointer group">
              <Link href="/dashboard/tasks">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <CheckCircle className="h-4 w-4 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  <CardTitle className="text-base font-medium text-gray-900">Lista e Punëve</CardTitle>
                  <CardDescription className="text-sm text-gray-600">Ndiqni progresin e detyrave tuaja</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-gray-900">Gjendja Aktuale</CardTitle>
                <CardDescription className="text-sm text-gray-600">
                  {taskStats.completed} nga {taskStats.total} detyra të përfunduara
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {taskStats.overdue > 0 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center border border-red-200">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900 text-sm">Detyra të Vonuara</p>
                    <p className="text-red-700 text-sm">
                      Keni {taskStats.overdue} detyrë{taskStats.overdue > 1 ? " të vonuara" : " të vonuar"} që duhen përfunduar
                    </p>
                  </div>
                </div>
              )}

              {guestStats.pending > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center border border-amber-200">
                    <Clock className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-amber-900 text-sm">Në Pritje të Përgjigjes</p>
                    <p className="text-amber-700 text-sm">
                      {guestStats.pending} mysafir{guestStats.pending > 1 ? "ë" : ""} ende nuk kanë dhënë përgjigje për ftesën
                    </p>
                  </div>
                </div>
              )}

              {taskStats.overdue === 0 && guestStats.pending === 0 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-900 text-sm">Gjithçka në Rregull!</p>
                    <p className="text-green-700 text-sm">
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
