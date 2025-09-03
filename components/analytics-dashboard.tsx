"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, Users, CheckCircle, Target, Zap } from "lucide-react"

interface AnalyticsProps {
  kpis: any | null
  activity: any[]
}

function toNumber(x: any): number {
  const n = typeof x === "number" ? x : parseFloat(String(x ?? 0))
  return Number.isFinite(n) ? n : 0
}

function formatCurrencyEUR(n: number) {
  try {
    return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  } catch {
    return String(Math.round(n))
  }
}

function pickDate(x: any): number | null {
  const d = x?.occurred_at || x?.updated_at || x?.created_at
  const t = d ? new Date(d).getTime() : NaN
  return Number.isFinite(t) ? t : null
}

export function AnalyticsDashboard({ kpis, activity }: AnalyticsProps) {
  const safe = (n: any) => toNumber(n)
  const guestsTotal = safe(kpis?.guests_total)
  const guestsAttending = safe(kpis?.guests_attending)
  const rsvpRate = safe(kpis?.rsvp_rate_pct)
  const tasksTotal = safe(kpis?.tasks_total)
  const tasksCompleted = safe(kpis?.tasks_completed)
  const taskRate = safe(kpis?.tasks_completed_pct)
  const vendorsTotal = safe(kpis?.vendors_total)
  const vendorsConfirmed = safe(kpis?.vendors_confirmed)
  const vendorRate = safe(kpis?.vendors_confirmed_pct)
  const overallProgress = safe(kpis?.overall_progress_pct)
  const spent = safe(kpis?.budget_spent)

  const metrics = [
    {
      title: "RSVP",
      value: `${Math.round(rsvpRate)}%`,
      sub: `${guestsAttending}/${guestsTotal}`,
      icon: CheckCircle,
      color: "emerald" as const,
    },
    {
      title: "Buxheti i Shpenzuar",
      value: `€${formatCurrencyEUR(spent)}`,
      sub: "",
      icon: DollarSign,
      color: "blue" as const,
    },
    {
      title: "Detyra të Kryera",
      value: `${tasksCompleted}/${tasksTotal}`,
      sub: `${Math.round(taskRate)}%`,
      icon: Target,
      color: "violet" as const,
    },
    {
      title: "Shitës të Konfirmuar",
      value: `${vendorsConfirmed}/${vendorsTotal}`,
      sub: `${Math.round(vendorRate)}%`,
      icon: Users,
      color: "amber" as const,
    },
  ]

  // Build last activity items from backend view
  const colorByType: Record<string, string> = {
    guest: "emerald",
    task: "indigo",
    vendor: "violet",
    expense: "rose",
  }
  const recentItems: { when: number; label: string; color: string }[] = (activity || [])
    .map((a: any) => {
      const when = pickDate(a)
      const label = a?.detail ? `${a.title}: ${a.detail}` : String(a?.title ?? "Aktivitet")
      const color = colorByType[a?.entity_type] || "gray"
      return when ? { when, label, color } : null
    })
    .filter(Boolean) as any[]

  recentItems.sort((a, b) => b.when - a.when)
  const topRecent = recentItems.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card
              key={index}
              className={`bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100 border-${metric.color}-200 shadow-lg hover:shadow-xl transition-all duration-300`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium text-${metric.color}-700`}>
                  {metric.title}
                </CardTitle>
                <Icon className={`h-4 w-4 text-${metric.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold text-${metric.color}-800`}>{metric.value}</div>
                {metric.sub ? (
                  <div className={`text-xs mt-1 text-${metric.color}-700`}>{metric.sub}</div>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Progress Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Target className="h-5 w-5" />
              Progresi i Përgjithshëm
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-700">Detyrat</span>
                <span className="text-indigo-600">{tasksCompleted}/{tasksTotal}</span>
              </div>
              <Progress value={taskRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-700">RSVP</span>
                <span className="text-indigo-600">{Math.round(rsvpRate)}%</span>
              </div>
              <Progress value={rsvpRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-700">Shitës</span>
                <span className="text-indigo-600">{vendorsConfirmed}/{vendorsTotal}</span>
              </div>
              <Progress value={vendorRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-indigo-700">Totali</span>
                <span className="text-indigo-600">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-800">
              <Zap className="h-5 w-5" />
              Aktiviteti i Fundit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topRecent.length === 0 ? (
                <div className="text-sm text-gray-600">Nuk ka ende aktivitet.</div>
              ) : (
                topRecent.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-white/60 rounded-lg">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500`}></div>
                    <span className="text-sm text-gray-700">{item.label}</span>
                    {/* Relative time could be added later with a util */}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
