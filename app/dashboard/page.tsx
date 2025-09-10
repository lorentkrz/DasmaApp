import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardEnterprise } from "@/components/dashboard-enterprise"
import { KPIGrid } from "@/components/dashboard/KPIGrid"
import { RecentGuestsTable } from "@/components/recent-guests-table"
import Link from "next/link"
import { Calendar, Users, DollarSign, CheckSquare } from "lucide-react"
import { Card } from "@/components/ui/card"

export async function generateMetadata() {
  return {
    title: 'Dashboard - Dasma ERP',
    description: 'Pamje e përgjithshme e dasmës'
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all data
  const [
    { data: guests },
    { data: tasks },
    { data: expenses },
    { data: vendors },
    { data: invitations },
    { data: cashGifts }
  ] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("tasks").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("expenses").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("vendors").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("invitations").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("cash_gifts").select("*").eq("wedding_id", currentWedding.id)
  ])

  const totalGuests = guests?.length || 0
  const attending = (guests || []).filter((g: any) => g.rsvp_status === "attending").length
  const rsvpRate = totalGuests ? Math.round((attending / totalGuests) * 100) : 0
  const tasksTotal = tasks?.length || 0
  const tasksDone = (tasks || []).filter((t: any) => t.completed === true).length
  const taskRate = tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0
  const spent = (expenses || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0)
  const vendorsConfirmed = (vendors || []).filter((v: any) => v.status === "confirmed").length
  const vendorsTotal = vendors?.length || 0

  const budgetTotal = Number(currentWedding.budget_total || 0)
  const spentPercent = budgetTotal > 0 ? Math.min(100, Math.round((spent / budgetTotal) * 100)) : 0
  const vendorsRate = vendorsTotal ? Math.round((vendorsConfirmed / vendorsTotal) * 100) : 0

  const kpis = [
    { title: "RSVP", value: `${rsvpRate}%`, delta: { value: `${attending}/${totalGuests}`, positive: true }, trendData: [Math.max(0, rsvpRate - 10), Math.max(0, rsvpRate - 4), rsvpRate] },
    { title: "Buxheti i Shpenzuar", value: `€${Math.round(spent).toLocaleString()}`, delta: { value: `${spentPercent}%`, positive: false }, trendData: [Math.max(0, spentPercent - 15), Math.max(0, spentPercent - 5), spentPercent] },
    { title: "Detyra të Kryera", value: `${tasksDone}/${tasksTotal}`, delta: { value: `${taskRate}%`, positive: true }, trendData: [Math.max(0, taskRate - 20), Math.max(0, taskRate - 7), taskRate] },
    { title: "Shitës të Konfirmuar", value: `${vendorsConfirmed}/${vendorsTotal}`, delta: { value: `${vendorsRate}%`, positive: true }, trendData: [Math.max(0, vendorsRate - 25), Math.max(0, vendorsRate - 8), vendorsRate] },
  ]

  const recentGuests = (guests || []).slice(0, 10)
  const daysUntil = Math.ceil((new Date(currentWedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const totalDeposits = (vendors || []).reduce((sum: number, v: any) => sum + Number(v.deposit_amount || 0), 0)
  const totalExpenses = Math.round(spent + totalDeposits)

  return (
    <DashboardLayout
      title="Dashboard"
      icon="Home"
    >
      <div className="space-y-6">
        <KPIGrid items={kpis as any} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="glass rounded-lg density-card border border-white/10 dark:border-white/10 self-start">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">Mysafirët e fundit</h2>
              <Link href="/dashboard/guests" className="text-xs text-[color:var(--muted-2025)] hover:text-[color:var(--text-2025)] transition-colors">
                Shiko të gjithë →
              </Link>
            </div>
            <div className="mt-1">
              <RecentGuestsTable data={recentGuests as any} />
            </div>
          </div>
          {/* Right: 2x2 stats - shorter, no height forcing */}
          <div className="grid grid-cols-2 gap-2 self-start">
            <Card>
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="text-sm font-medium">Ditë deri në dasmë</div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="px-3 pb-2">
                <div className="text-2xl font-bold">{daysUntil}</div>
                <p className="text-xs text-muted-foreground">{new Date(currentWedding.wedding_date).toLocaleDateString('sq-AL')}</p>
              </div>
            </Card>
            <Card>
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="text-sm font-medium">Mysafirë Konfirmuar</div>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="px-3 pb-2">
                <div className="text-2xl font-bold">{attending}/{totalGuests}</div>
              </div>
            </Card>
            <Card>
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="text-sm font-medium">Buxheti Përdorur</div>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="px-3 pb-2">
                <div className="text-2xl font-bold">€{totalExpenses.toLocaleString()}</div>
              </div>
            </Card>
            <Card>
              <div className="px-3 pt-2 pb-1 flex items-center justify-between">
                <div className="text-sm font-medium">Detyra</div>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="px-3 pb-2">
                <div className="text-2xl font-bold">{tasksDone}/{tasksTotal}</div>
              </div>
            </Card>
          </div>
        </div>
        {/* Charts and rest, spaced correctly below */}
        <DashboardEnterprise 
          wedding={currentWedding}
          guests={guests || []}
          expenses={expenses || []}
          vendors={vendors || []}
          tasks={tasks || []}
          invitations={invitations || []}
          cashGifts={cashGifts || []}
          hideHeaderStats
        />
      </div>
    </DashboardLayout>
  )
}
