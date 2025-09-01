"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Gift } from "lucide-react"

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
      {/* Total Budget Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Total Budget</CardTitle>
          <DollarSign className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">${totalBudget.toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* Total Spent Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Total Spent</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">${totalSpent.toLocaleString()}</div>
          <div className="text-xs text-slate-600">{spentPercentage.toFixed(1)}% of budget</div>
        </CardContent>
      </Card>

      {/* Cash Gifts (Bakshish) Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Cash Gifts</CardTitle>
          <Gift className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">${totalGifts.toLocaleString()}</div>
          <div className="text-xs text-slate-600">Contributions from guests</div>
        </CardContent>
      </Card>

      {/* Remaining Budget Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Remaining</CardTitle>
          {remainingBudget >= 0 ? <CheckCircle className="h-4 w-4 text-slate-600" /> : <AlertTriangle className="h-4 w-4 text-slate-600" />}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${remainingBudget >= 0 ? "text-slate-900" : "text-red-700"}`}>${Math.abs(remainingBudget).toLocaleString()}</div>
          <div className={`text-xs ${remainingBudget >= 0 ? "text-slate-600" : "text-red-600"}`}>{remainingBudget >= 0 ? "Under budget" : "Over budget"}</div>
        </CardContent>
      </Card>

      {/* Budget Progress Card */}
      <Card className="border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Budget Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={Math.min(spentPercentage, 100)} className="w-full" />
          <div className="text-xs text-slate-600 mt-2">{spentPercentage.toFixed(1)}% used</div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="md:col-span-2 lg:col-span-4 border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categorySpending.map((category) => (
              <div key={category.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color || "#64748b" }} />
                    <span className="text-sm font-medium text-gray-700">{category.name}</span>
                  </div>
                  <span className="text-sm text-gray-600">${Number(category.spent).toLocaleString()}</span>
                </div>
                <Progress value={Math.min(category.percentage, 100)} className="h-2" />
                <div className="text-xs text-gray-500">{category.percentage.toFixed(1)}% of allocated budget</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
