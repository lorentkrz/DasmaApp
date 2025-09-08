"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Users,
  DollarSign,
  CheckSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"

interface DashboardProps {
  wedding: any
  guests: any[]
  expenses: any[]
  vendors: any[]
  tasks: any[]
  invitations: any[]
  cashGifts: any[]
}

export function DashboardEnterprise({
  wedding,
  guests,
  expenses,
  vendors,
  tasks,
  invitations,
  cashGifts
}: DashboardProps) {
  // Metrics
  const totalGuests = guests.length
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'attending').length
  const totalBudget = Number(wedding.budget_total || 0)
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalDeposits = vendors.reduce((sum, v) => sum + Number(v.deposit_amount || 0), 0)
  const totalGifts = cashGifts.reduce((sum, g) => sum + Number(g.amount || 0), 0)
  const totalExpenses = totalSpent + totalDeposits
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const pendingInvitations = invitations.filter(i => !i.sent_at).length

  // Days until wedding
  const daysUntil = Math.ceil((new Date(wedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  // RSVP data for pie chart
  const rsvpData = [
    { name: 'Po', value: guests.filter(g => g.rsvp_status === 'attending').length },
    { name: 'Jo', value: guests.filter(g => g.rsvp_status === 'not_attending').length },
    { name: 'Ndoshta', value: guests.filter(g => g.rsvp_status === 'maybe').length },
    { name: 'Pritje', value: guests.filter(g => g.rsvp_status === 'pending').length }
  ]

  // Budget data for bar chart
  const budgetData = [
    { name: 'Buxheti', value: totalBudget },
    { name: 'Shpenzime', value: totalSpent },
    { name: 'Deposite', value: totalDeposits },
    { name: 'Dhurata', value: totalGifts }
  ]

  // Task progress data
  const taskData = [
    { name: 'Përfunduar', value: tasks.filter(t => t.status === 'completed').length },
    { name: 'Në progres', value: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Pritje', value: tasks.filter(t => t.status === 'pending').length }
  ]

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6b7280']

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ditë deri në dasmë</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysUntil}</div>
            <p className="text-xs text-muted-foreground">
              {new Date(wedding.wedding_date).toLocaleDateString('sq-AL')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mysafirë Konfirmuar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedGuests}/{totalGuests}</div>
            <Progress value={(confirmedGuests / totalGuests) * 100} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Buxheti Përdorur</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">nga €{totalBudget.toLocaleString()}</p>
            <Progress value={totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0} className="h-1 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Detyra</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{tasks.length}</div>
            <Progress value={tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RSVP Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">RSVP Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={rsvpData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {rsvpData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1 mt-3 text-xs">
              {rsvpData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded" style={{ backgroundColor: COLORS[index] }} />
                  <span className="truncate">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Budget Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Financat</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={budgetData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Detyrat</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={taskData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Veprime të Shpejta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingInvitations > 0 && (
                <Link href="/dashboard/invitations" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{pendingInvitations} ftesa pa dërguar</span>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </Link>
              )}
              {tasks.filter(t => t.status === 'pending').length > 0 && (
                <Link href="/dashboard/tasks" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{tasks.filter(t => t.status === 'pending').length} detyra në pritje</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </Link>
              )}
              {guests.filter(g => g.rsvp_status === 'pending').length > 0 && (
                <Link href="/dashboard/guests" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{guests.filter(g => g.rsvp_status === 'pending').length} RSVP në pritje</span>
                  <Users className="h-4 w-4 text-gray-500" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Përmbledhje Financiare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Buxheti Total</span>
                <span className="font-medium">€{totalBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Shpenzime</span>
                <span className="font-medium text-red-600">-€{totalSpent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Deposite</span>
                <span className="font-medium text-orange-600">-€{totalDeposits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dhurata</span>
                <span className="font-medium text-green-600">+€{totalGifts.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Bilanci</span>
                  <span className="font-bold">€{(totalBudget - totalExpenses + totalGifts).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
