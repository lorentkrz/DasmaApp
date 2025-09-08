"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface ReportsOverviewProps {
  wedding: any
  guests: any[]
  expenses: any[]
  vendors: any[]
  tasks: any[]
  invitations: any[]
  cashGifts: any[]
  vendorPayments: any[]
}

export function ReportsOverview({
  wedding,
  guests,
  expenses,
  vendors,
  tasks,
  invitations,
  cashGifts,
  vendorPayments
}: ReportsOverviewProps) {
  // Calculate metrics
  const totalGuests = guests.length
  const confirmedGuests = guests.filter(g => g.rsvp_status === 'attending').length
  const totalBudget = Number(wedding.budget_total || 0)
  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0) +
    vendorPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalGifts = cashGifts.reduce((sum, g) => sum + Number(g.amount || 0), 0)
  const completedTasks = tasks.filter(t => t.status === 'completed').length

  // RSVP breakdown
  const rsvpStats = {
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    not_attending: guests.filter(g => g.rsvp_status === 'not_attending').length,
    maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  }

  // Vendor categories
  const vendorsByCategory = vendors.reduce((acc, v) => {
    const cat = v.category || 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mysafirë Konfirmuar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedGuests}/{totalGuests}</div>
            <Progress value={(confirmedGuests / totalGuests) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Buxheti Përdorur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalSpent.toLocaleString()}</div>
            <Progress value={(totalSpent / totalBudget) * 100} className="h-2 mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Dhurata Marrë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalGifts.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-2">{cashGifts.length} dhurata</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Detyra Përfunduar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}/{tasks.length}</div>
            <Progress value={tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* RSVP Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Statusi i RSVP</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Po vijnë</span>
              <span className="font-semibold">{rsvpStats.attending}</span>
            </div>
            <Progress value={(rsvpStats.attending / totalGuests) * 100} className="h-2 bg-gray-200" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nuk vijnë</span>
              <span className="font-semibold">{rsvpStats.not_attending}</span>
            </div>
            <Progress value={(rsvpStats.not_attending / totalGuests) * 100} className="h-2 bg-gray-200" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ndoshta</span>
              <span className="font-semibold">{rsvpStats.maybe}</span>
            </div>
            <Progress value={(rsvpStats.maybe / totalGuests) * 100} className="h-2 bg-gray-200" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Në pritje</span>
              <span className="font-semibold">{rsvpStats.pending}</span>
            </div>
            <Progress value={(rsvpStats.pending / totalGuests) * 100} className="h-2 bg-gray-200" />
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Përmbledhje Financiare</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Buxheti Total</span>
              <span className="font-semibold">€{totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Shpenzuar</span>
              <span className="font-semibold text-red-600">-€{totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Dhurata</span>
              <span className="font-semibold text-green-600">+€{totalGifts.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Bilanci</span>
              <span className="font-bold text-lg">€{(totalBudget - totalSpent + totalGifts).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Shitësit sipas Kategorisë</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(vendorsByCategory).map(([category, count]) => (
              <div key={category} className="flex justify-between py-2 border-b">
                <span className="text-gray-600 capitalize">{category}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
