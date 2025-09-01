"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Edit, Trash2, Receipt } from "lucide-react"
import Link from "next/link"

interface ExpenseListProps {
  expenses: any[]
  categories: { id: string; name: string; color?: string }[]
  onEdit?: (expense: any) => void
}

export function ExpenseList({ expenses, categories, onEdit }: ExpenseListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categoryMap = new Map<string, { name: string; color?: string }>((categories || []).map((c) => [c.id, { name: c.name, color: c.color }]))
  const categoryNames = ["all", ...(categories || []).map((c) => c.name)]

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (expense.vendor?.toLowerCase?.().includes(searchTerm.toLowerCase()) ?? false)
    const resolvedName = expense.category_id ? categoryMap.get(expense.category_id)?.name : undefined
    const expenseCategory = resolvedName ?? "Uncategorized"
    const matchesCategory = selectedCategory === "all" || (resolvedName ? resolvedName === selectedCategory : selectedCategory === "Uncategorized")
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Venue: "bg-amber-100 text-amber-800",
      Catering: "bg-rose-100 text-rose-800",
      Photography: "bg-purple-100 text-purple-800",
      Flowers: "bg-pink-100 text-pink-800",
      "Music/DJ": "bg-blue-100 text-blue-800",
      Attire: "bg-green-100 text-green-800",
      Transportation: "bg-orange-100 text-orange-800",
      Decorations: "bg-teal-100 text-teal-800",
      Miscellaneous: "bg-gray-100 text-gray-800",
    }
    return colors[category] || "bg-gray-100 text-gray-800"
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-slate-900">Recent Expenses</CardTitle>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name === "all" ? "All Categories" : name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No expenses found</p>
            <p className="text-sm">Add your first expense to start tracking your budget</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{expense.description}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {expense.category_id && (
                          <Badge className={getCategoryColor(categoryMap.get(expense.category_id)?.name || "Miscellaneous")}>
                            {categoryMap.get(expense.category_id)?.name || "Uncategorized"}
                          </Badge>
                        )}
                        {expense.vendor && <span className="text-sm text-gray-500">• {expense.vendor}</span>}
                        <span className="text-sm text-gray-500">
                          • {new Date(expense.expense_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expense.notes && <p className="text-sm text-gray-600 mt-2">{expense.notes}</p>}
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">${Number(expense.amount).toLocaleString()}</div>
                    <div className={`text-sm ${expense.payment_status === "paid" ? "text-green-600" : "text-orange-600"}`}>
                      {expense.payment_status === "paid" ? "Paid" : "Pending"}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {onEdit ? (
                      <Button variant="outline" size="sm" onClick={() => onEdit(expense)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link href={`/dashboard/budget/${expense.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
