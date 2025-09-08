"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
} from "recharts"

interface GuestStats {
  total: number
  confirmed: number
  pending: number
}

interface TaskStats {
  total: number
  completed: number
  overdue: number
}

type Kpis = {
  budget_spent?: number
  budget_total?: number
} | null

type CategoryDatum = { name: string; value: number; color?: string }

export function DashboardMiniCharts({ guestStats, taskStats, kpis, expensesByCategory = [] }: { guestStats: GuestStats; taskStats: TaskStats; kpis?: Kpis; expensesByCategory?: CategoryDatum[] }) {
  const rsvpData = [
    { name: "Konfirmuar", value: guestStats.confirmed, fill: "#10B981" },
    { name: "Në pritje", value: guestStats.pending, fill: "#F59E0B" },
    { name: "Të tjerë", value: Math.max(guestStats.total - guestStats.confirmed - guestStats.pending, 0), fill: "#94A3B8" },
  ]

  const taskData = [
    { name: "Përfunduar", value: taskStats.completed, fill: "#6366F1" },
    { name: "Në progres", value: Math.max(taskStats.total - taskStats.completed, 0), fill: "#60A5FA" },
    { name: "Të vonuara", value: taskStats.overdue, fill: "#EF4444" },
  ]

  const budgetSpent = Math.max(Number(kpis?.budget_spent || 0), 0)
  const budgetTotal = Math.max(Number(kpis?.budget_total || 0), 0)
  const budgetRemaining = Math.max(budgetTotal - budgetSpent, 0)
  const showBudget = budgetTotal > 0 || budgetSpent > 0
  const budgetData = [
    { name: "Shpenzuar", value: budgetSpent, fill: "#0EA5E9" },
    { name: "E mbetur", value: budgetRemaining, fill: "#93C5FD" },
  ]

  const topCategories = (expensesByCategory || []).slice(0, 6)
  const showCategories = topCategories.length > 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Përmbledhja e RSVP</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            id="rsvp"
            className="h-56"
            config={{
              confirmed: { label: "Konfirmuar", color: "#10B981" },
              pending: { label: "Në pritje", color: "#F59E0B" },
              other: { label: "Të tjerë", color: "#94A3B8" },
            }}
          >
            <PieChart>
              <Pie data={rsvpData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} strokeWidth={0}>
                {rsvpData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ChartContainer>
          <div className="mt-3 text-xs text-gray-600">Totali i mysafirëve: {guestStats.total}</div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Detyrat</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ChartContainer
            id="tasks"
            className="h-56"
            config={{ done: { label: "Përfunduar" }, todo: { label: "Në progres" }, overdue: { label: "Të vonuara" } }}
          >
            <BarChart data={taskData} margin={{ top: 8, right: 8, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} interval={0} angle={0} dy={10} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {taskData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
          <div className="mt-3 text-xs text-gray-600">Totali i detyrave: {taskStats.total}</div>
        </CardContent>
      </Card>

      {showBudget && (
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Buxheti</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer
              id="budget"
              className="h-56"
              config={{ spent: { label: "Shpenzuar" }, left: { label: "E mbetur" } }}
            >
              <PieChart>
                <Pie data={budgetData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} strokeWidth={0}>
                  {budgetData.map((entry, index) => (
                    <Cell key={`budget-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-3 text-xs text-gray-600">
              Shpenzuar: €{Math.round(budgetSpent).toLocaleString()} / €{Math.round(budgetTotal).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {showCategories && (
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Shpenzime sipas Kategorisë</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ChartContainer id="expenses-by-category" className="h-56" config={{}}>
              <PieChart>
                <Pie data={topCategories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} strokeWidth={0}>
                  {topCategories.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color || ["#60A5FA","#34D399","#F59E0B","#F472B6","#A78BFA","#F87171"][index % 6]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="mt-3 text-xs text-gray-600">
              Top {topCategories.length} kategori për nga shpenzimet
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
