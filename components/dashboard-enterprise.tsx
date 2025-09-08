"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Users, DollarSign, CheckSquare, Calendar, Clock, AlertCircle } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { motion } from "framer-motion"

interface DashboardProps {
  wedding: any
  guests: any[]
  expenses: any[]
  vendors: any[]
  tasks: any[]
  invitations: any[]
  cashGifts: any[]
}

const COLORS = ['#34d399', '#f87171', '#fbbf24', '#9ca3af']

export function DashboardEnterprise({ wedding, guests, expenses, vendors, tasks, invitations, cashGifts }: DashboardProps) {
  const totalGuests = guests.length
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'attending').length
  const totalBudget = Number(wedding.budget_total || 0)
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalDeposits = vendors.reduce((sum, v) => sum + Number(v.deposit_amount || 0), 0)
  const totalGifts = cashGifts.reduce((sum, g) => sum + Number(g.amount || 0), 0)
  const totalExpenses = totalSpent + totalDeposits
  const completedTasks = tasks.filter(t => t.completed === true).length
  const pendingInvitations = invitations.filter(i => !i.sent_at).length
  const daysUntil = Math.ceil((new Date(wedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  const rsvpData = [
    { name: 'Po', value: confirmedGuests },
    { name: 'Jo', value: guests.filter(g => g.rsvp_status === 'not_attending').length },
    { name: 'Ndoshta', value: guests.filter(g => g.rsvp_status === 'maybe').length },
    { name: 'Pritje', value: guests.filter(g => g.rsvp_status === 'pending').length }
  ]

  const budgetData = [
    { name: 'Buxheti', value: totalBudget },
    { name: 'Shpenzime', value: totalSpent },
    { name: 'Depozitë', value: totalDeposits },
    { name: 'Dhurata', value: totalGifts }
  ]

  const taskData = [
    { name: 'Përfunduar', value: tasks.filter(t => t.completed === true).length, color: '#34d399' },
    { name: 'Në progres', value: tasks.filter(t => t.completed === false && t.due_date && new Date(t.due_date) > new Date()).length, color: '#fbbf24' },
    { name: 'Pritje', value: tasks.filter(t => t.completed === false && (!t.due_date || new Date(t.due_date) <= new Date())).length, color: '#9ca3af' }
  ]

  // Custom tooltips
  const GuestsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="rounded-md border bg-white shadow px-3 py-2 text-xs">
          <div className="font-medium">{item?.name}</div>
          <div className="text-gray-600">{item?.value} mysafirë</div>
        </div>
      )
    }
    return null
  }

  const MoneyTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]
      return (
        <div className="rounded-md border bg-white shadow px-3 py-2 text-xs">
          <div className="font-medium">{item?.payload?.name}</div>
          <div className="text-gray-600">€{Number(item?.value || 0).toLocaleString()}</div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Ditë deri në dasmë</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysUntil}</div>
            <p className="text-xs text-muted-foreground">{new Date(wedding.wedding_date).toLocaleDateString('sq-AL')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Mysafirë Konfirmuar</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedGuests}/{totalGuests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Buxheti Përdorur</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalExpenses.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center pb-2">
            <CardTitle className="text-sm font-medium">Detyra</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{tasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* RSVP Donut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">RSVP Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <defs>
                    <linearGradient id="gradYes" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <linearGradient id="gradNo" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#ef4444" />
                    </linearGradient>
                    <linearGradient id="gradMaybe" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9ca3af" />
                      <stop offset="100%" stopColor="#6b7280" />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={rsvpData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                  >
                    {rsvpData.map((entry, index) => (
                      <Cell key={index} fill={[
                        'url(#gradYes)','url(#gradNo)','url(#gradMaybe)','url(#gradPending)'
                      ][index]} />
                    ))}
                  </Pie>
                  <Tooltip content={<GuestsTooltip />} />
                  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">{confirmedGuests}</div>
                  <div className="text-sm text-gray-500">nga {totalGuests}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Stacked Bars */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Financat</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={budgetData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBudget" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                  <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                  <linearGradient id="gradDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="gradGifts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="value" radius={[8,8,0,0]}>
                  {budgetData.map((entry, index) => (
                    <Cell key={index} fill={[ 'url(#gradBudget)', 'url(#gradSpent)', 'url(#gradDeposit)', 'url(#gradGifts)' ][index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks Radial Bar */}
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Detyrat</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={taskData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                  <linearGradient id="gradPendingTask" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9ca3af" />
                    <stop offset="100%" stopColor="#6b7280" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => `${val} detyra`} />
                <Bar dataKey="value" radius={[8,8,0,0]}>
                  {taskData.map((entry, index) => (
                    <Cell key={index} fill={[ 'url(#gradDone)', 'url(#gradInProgress)', 'url(#gradPendingTask)' ][index]} />
                  ))}
                </Bar>
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
                <span className="font-medium text-red-600">-€{totalExpenses.toLocaleString()}</span>
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
