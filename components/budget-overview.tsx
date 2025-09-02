"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Sparkles, DollarSign, TrendingUp, Gift, CheckCircle, AlertTriangle } from "lucide-react"

interface BudgetOverviewProps {
  wedding: any
  expenses: any[]
  categories: { id: string; name: string; budgeted_amount: number; color?: string }[]
  gifts?: { id: string; amount: number; gift_date?: string; guest_id?: string | null }[]
}

export function BudgetOverview({ wedding, expenses, categories, gifts = [] }: BudgetOverviewProps) {
  // weddings schema uses budget_total
  const totalBudget = Number(wedding.budget_total || 0)
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const totalGifts = (gifts || []).reduce((sum, g) => sum + Number(g.amount || 0), 0)
  // Gifts offset spending: remaining = budget - spent + gifts
  const remainingBudget = totalBudget - totalSpent + totalGifts
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Calculate spending by category
  const categorySpending = (categories || []).map((category) => {
    const categoryExpenses = expenses.filter((expense) => expense.category_id === category.id)
    const spent = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const budgetAllocation = Number(category.budgeted_amount || 0)

    return {
      ...category,
      spent,
      budget: budgetAllocation,
      percentage: budgetAllocation > 0 ? (spent / budgetAllocation) * 100 : 0,
    }
  })

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Enhanced Total Budget Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-blue-100/50 to-indigo-100/50 rounded-t-2xl">
          <CardTitle className="text-sm font-bold text-blue-700">Buxheti Total</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-3xl font-bold text-blue-800">€{totalBudget.toLocaleString()}</div>
          <p className="text-xs text-blue-600 mt-1">për dasmën tuaj</p>
        </CardContent>
      </Card>

      {/* Enhanced Total Spent Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-orange-100/50 to-red-100/50 rounded-t-2xl">
          <CardTitle className="text-sm font-bold text-orange-700">Shpenzuar Gjithsej</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-3xl font-bold text-orange-800">€{totalSpent.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">{spentPercentage.toFixed(1)}% e buxhetit</div>
        </CardContent>
      </Card>

      {/* Enhanced Cash Gifts Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-t-2xl">
          <CardTitle className="text-sm font-bold text-purple-700">Dhurata në Para</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <Gift className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-3xl font-bold text-purple-800">€{totalGifts.toLocaleString()}</div>
          <div className="text-xs text-purple-600 mt-1">nga mysafirët</div>
        </CardContent>
      </Card>

      {/* Enhanced Remaining Budget Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-3 rounded-t-2xl ${remainingBudget >= 0 ? 'bg-gradient-to-r from-emerald-100/50 to-green-100/50' : 'bg-gradient-to-r from-red-100/50 to-rose-100/50'}`}>
          <CardTitle className={`text-sm font-bold ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {remainingBudget >= 0 ? 'Mbetur' : 'Tejkaluar'}
          </CardTitle>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${remainingBudget >= 0 ? 'bg-gradient-to-r from-emerald-400 to-green-400' : 'bg-gradient-to-r from-red-400 to-rose-400'}`}>
            {remainingBudget >= 0 ? <CheckCircle className="h-4 w-4 text-white" /> : <AlertTriangle className="h-4 w-4 text-white" />}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className={`text-3xl font-bold ${remainingBudget >= 0 ? "text-emerald-800" : "text-red-800"}`}>
            €{Math.abs(remainingBudget).toLocaleString()}
          </div>
          <div className={`text-xs mt-1 ${remainingBudget >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {remainingBudget >= 0 ? "brenda buxhetit" : "mbi buxhet"}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Budget Progress Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-teal-100/50 to-cyan-100/50 rounded-t-2xl">
          <CardTitle className="text-sm font-bold text-teal-700">Progresi i Buxhetit</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Progress value={Math.min(spentPercentage, 100)} className="w-full h-3 bg-gray-200" />
          <div className="text-xs text-teal-600 mt-2 font-medium">{spentPercentage.toFixed(1)}% e përdorur</div>
        </CardContent>
      </Card>

      {/* Enhanced Category Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4 rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-slate-100/50 to-gray-100/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800">Shpenzime sipas Kategorive</CardTitle>
              <p className="text-gray-600">Shikoni se si po shpërdahet buxheti për çdo kategori</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categorySpending.map((category) => (
              <div key={category.name} className="space-y-3 bg-gradient-to-r from-gray-50 to-slate-50 p-4 rounded-xl border border-gray-200/50">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl mb-2"><DollarSign className="h-8 w-8 mx-auto text-slate-600" /></div>
                    <span className="text-sm font-bold text-gray-800">{category.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-700">€{Number(category.spent).toLocaleString()}</span>
                </div>
                <Progress value={Math.min(category.percentage, 100)} className="h-3 bg-gray-200" />
              </div>
            ))}
          </div>
          {/* Motivational Footer */}
          <div className="mt-8 bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <DollarSign className="h-5 w-5 text-slate-500" />
              <CheckCircle className="h-4 w-4 text-gray-500" />
              <DollarSign className="h-5 w-5 text-slate-500" />
            </div>
            <p className="text-gray-700 italic font-medium text-lg">
              "Çdo investim për dasmën tuaj është një investim për kujtimet e përjetshme"
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Nuk ka kategori buxheti të krijuara ende
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
