"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Heart, Sparkles, DollarSign, TrendingUp, Gift, CheckCircle, AlertTriangle } from "lucide-react"

interface BudgetOverviewProps {
  wedding: any
  expenses: any[]
  categories: { id: string; name: string; budgeted_amount: number; color?: string }[]
  gifts?: { id: string; amount: number; gift_date?: string; guest_id?: string | null }[]
  vendors?: { id: string; name: string; contract_amount: number; deposit_amount: number; deposit_paid: boolean; status: string }[]
}

export function BudgetOverview({ wedding, expenses, categories, gifts = [], vendors = [] }: BudgetOverviewProps) {
  // weddings schema uses budget_total
  const totalBudget = Number(wedding.budget_total || 0)
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
  const totalGifts = (gifts || []).reduce((sum, g) => sum + Number(g.amount || 0), 0)
  
  // Calculate contract commitments and deposits paid
  const totalContractCommitments = (vendors || []).reduce((sum, vendor) => 
    sum + Number(vendor.contract_amount || 0), 0)
  const totalDepositsPaid = (vendors || []).reduce((sum, vendor) => 
    vendor.deposit_paid ? sum + Number(vendor.deposit_amount || 0) : sum, 0)
  
  // Total spent includes expenses and deposits paid
  const totalSpentWithDeposits = totalSpent + totalDepositsPaid
  // Gifts offset spending: remaining = budget - spent + gifts - remaining contract obligations
  const remainingContractObligations = totalContractCommitments - totalDepositsPaid
  const remainingBudget = totalBudget - totalSpentWithDeposits + totalGifts - remainingContractObligations
  const spentPercentage = totalBudget > 0 ? (totalSpentWithDeposits / totalBudget) * 100 : 0

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
          <div className="text-3xl font-bold text-orange-800">€{totalSpentWithDeposits.toLocaleString()}</div>
          <div className="text-xs text-orange-600 mt-1">{spentPercentage.toFixed(1)}% e buxhetit</div>
          {totalDepositsPaid > 0 && (
            <div className="text-xs text-orange-500 mt-1">€{totalDepositsPaid.toLocaleString()} depozita</div>
          )}
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

      {/* Enhanced Contract Commitments Card */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-amber-100/50 to-yellow-100/50 rounded-t-2xl">
          <CardTitle className="text-sm font-bold text-amber-700">Kontrata të Nënshkruara</CardTitle>
          <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center">
            <CheckCircle className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-3xl font-bold text-amber-800">€{totalContractCommitments.toLocaleString()}</div>
          <div className="text-xs text-amber-600 mt-1">€{remainingContractObligations.toLocaleString()} mbetur</div>
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

    </div>
  )
}
