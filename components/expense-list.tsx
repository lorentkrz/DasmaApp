"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Edit, Trash2, Receipt, DollarSign } from "lucide-react"
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
      Venue: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm",
      Catering: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm",
      Photography: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300 shadow-sm",
      Flowers: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm",
      "Music/DJ": "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm",
      Attire: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm",
      Transportation: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300 shadow-sm",
      Decorations: "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 border-teal-300 shadow-sm",
      Miscellaneous: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
    }
    return colors[category] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm"
  }

  return (
    <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-emerald-100/50 to-green-100/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">Lista e Shpenzimeve</CardTitle>
            <p className="text-gray-600">Gjurmoni të gjitha shpenzimet për dasmën tuaj</p>
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <Input
              placeholder="Kërko shpenzime sipas përshkrimit apo shitësit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-slate-300 focus:ring-slate-200 shadow-lg"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="h-5 w-5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white/80 backdrop-blur-sm shadow-lg font-medium"
            >
              {categoryNames.map((name) => (
                <option key={name} value={name}>
                  {name === "all" ? "Të gjitha kategoritë" : name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                <Receipt className="h-8 w-8 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Nuk u gjetën shpenzime
                </p>
                <p className="text-gray-500">
                  Nuk ka shpenzime të regjistruara endetë filluar gjurmimin e buxhetit
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-6 border border-slate-100/50 rounded-2xl hover:bg-slate-50/30 transition-all shadow-lg bg-white/50 backdrop-blur-sm"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{expense.description}</h3>
                      <div className="flex items-center space-x-3 mt-2">
                        {expense.category_id && (
                          <Badge variant="outline" className={`${getCategoryColor(categoryMap.get(expense.category_id)?.name || "Miscellaneous")} font-medium`}>
                            {categoryMap.get(expense.category_id)?.name || "Pa kategori"}
                          </Badge>
                        )}
                        {expense.vendor && (
                          <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-lg">
                            {expense.vendor}
                          </span>
                        )}
                        {expense.source && (
                          <Badge variant="outline" className={`text-xs font-medium ${
                            expense.source === 'vendor' 
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200' 
                              : 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200'
                          }`}>
                            {expense.source === 'vendor' ? 'Kontratë' : 'Manual'}
                          </Badge>
                        )}
                        <span className="text-sm text-gray-600 bg-amber-50 px-3 py-1 rounded-lg">
                          {new Date(expense.date).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {expense.notes && (
                    <p className="text-sm text-gray-600 mt-3 bg-gray-50 px-3 py-2 rounded-lg">
                      {expense.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-2xl mb-2"><DollarSign className="h-8 w-8 mx-auto text-slate-600" /></div> 
                    <div className="text-2xl font-bold text-gray-900">${Number(expense.amount).toLocaleString()}</div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-lg ${expense.payment_status === "paid" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"}`}>
                      {expense.payment_status === "paid" ? "Paguar" : "Në pritje"}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {expense.source !== 'vendor' && (
                      <>
                        {onEdit ? (
                          <Button variant="outline" size="sm" onClick={() => onEdit(expense)} className="rounded-xl hover:bg-blue-50 border-blue-200">
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                        ) : (
                          <Link href={`/dashboard/budget/${expense.id}/edit`}>
                            <Button variant="outline" size="sm" className="rounded-xl hover:bg-blue-50 border-blue-200">
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                        )}
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {expense.source === 'vendor' && (
                      <Link href={`/dashboard/vendors`}>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-green-50 border-green-200 text-green-600">
                          Shiko Kontratën
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Enhanced Footer */}
        {filteredExpenses.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-gray-700 font-medium">
                Duke shfaqur <span className="font-bold text-emerald-600">{filteredExpenses.length}</span> nga <span className="font-bold text-gray-800">{expenses.length}</span> shpenzime
              </span>
              <DollarSign className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
