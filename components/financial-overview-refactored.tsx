"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StandardTable } from "@/components/ui/standard-table"
import { Button } from "@/components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Gift, 
  CheckCircle, 
  AlertTriangle, 
  Receipt,
  Calendar,
  User,
  Building,
  CreditCard,
  Store,
  Sparkles,
  Heart,
  PiggyBank,
  Wallet,
  Calculator,
  ChevronRight,
  Plus,
  Banknote
} from "lucide-react"
import Link from "next/link"

interface FinancialOverviewProps {
  wedding: any
  expenses: any[]
  categories: any[]
  gifts: any[]
  vendors: any[]
}

export function FinancialOverviewRefactored({ wedding, expenses, categories, gifts, vendors }: FinancialOverviewProps) {
  
  // Calculate totals
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) +
    vendors.filter(v => v.deposit_amount > 0).reduce((sum, vendor) => sum + Number(vendor.deposit_amount || 0), 0)
  
  const totalGifts = gifts.reduce((sum, gift) => sum + Number(gift.amount || 0), 0)
  const netSpending = totalSpent - totalGifts
  
  // Calculate budget totals
  const totalBudget = Number(wedding.budget_total || 0)
  const remainingBudget = totalBudget - totalSpent
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Expense table columns
  const expenseColumns = [
    {
      key: "description",
      header: "Përshkrimi",
      accessor: (expense: any) => expense.description,
      sortable: true
    },
    {
      key: "category",
      header: "Kategoria",
      accessor: (expense: any) => expense.category,
      sortable: true
    },
    {
      key: "amount",
      header: "Shuma",
      accessor: (expense: any) => `€${Number(expense.amount).toLocaleString()}`,
      sortable: true
    },
    {
      key: "payment_status",
      header: "Statusi",
      accessor: (expense: any) => (
        <Badge className={expense.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
          {expense.payment_status === 'paid' ? 'Paguar' : 'Në pritje'}
        </Badge>
      ),
      sortable: true
    },
    {
      key: "created_at",
      header: "Data",
      accessor: (expense: any) => new Date(expense.created_at).toLocaleDateString('sq-AL'),
      sortable: true
    },
  ]

  // Vendor table columns
  const vendorColumns = [
    {
      key: "name",
      header: "Emri",
      accessor: (vendor: any) => vendor.name,
      sortable: true
    },
    {
      key: "category",
      header: "Kategoria",
      accessor: (vendor: any) => vendor.category,
      sortable: true
    },
    {
      key: "contract_amount",
      header: "Kontrata",
      accessor: (vendor: any) => `€${Number(vendor.contract_amount || 0).toLocaleString()}`,
      sortable: true
    },
    {
      key: "deposit_amount",
      header: "Depozita",
      accessor: (vendor: any) => `€${Number(vendor.deposit_amount || 0).toLocaleString()}`,
      sortable: true
    },
    {
      key: "deposit_paid",
      header: "Statusi",
      accessor: (vendor: any) => (
        <Badge className={vendor.deposit_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
          {vendor.deposit_paid ? 'Paguar' : 'Në pritje'}
        </Badge>
      ),
      sortable: true
    },
  ]

  // Gift table columns
  const giftColumns = [
    {
      key: "gift_date",
      header: "Data",
      accessor: (gift: any) => new Date(gift.gift_date).toLocaleDateString('sq-AL'),
      sortable: true
    },
    {
      key: "amount",
      header: "Shuma",
      accessor: (gift: any) => `€${Number(gift.amount).toLocaleString()}`,
      sortable: true
    },
    {
      key: "notes",
      header: "Shënime",
      accessor: (gift: any) => gift.notes || '-',
      sortable: false
    },
  ]

  // Format expense data for table
  const expenseData = expenses.map(expense => ({
    ...expense,
    amount: `€${Number(expense.amount).toLocaleString()}`,
    payment_status: (
      <Badge className={expense.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
        {expense.payment_status === 'paid' ? 'Paguar' : 'Në pritje'}
      </Badge>
    ),
    created_at: new Date(expense.created_at).toLocaleDateString('sq-AL')
  }))

  // Format vendor data for table
  const vendorData = vendors.map(vendor => ({
    ...vendor,
    contract_amount: `€${Number(vendor.contract_amount || 0).toLocaleString()}`,
    deposit_amount: `€${Number(vendor.deposit_amount || 0).toLocaleString()}`,
    deposit_paid: (
      <Badge className={vendor.deposit_paid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>
        {vendor.deposit_paid ? 'Paguar' : 'Në pritje'}
      </Badge>
    ),
  }))

  // Format gift data for table
  const giftData = gifts.map(gift => ({
    ...gift,
    amount: `€${Number(gift.amount).toLocaleString()}`,
    gift_date: new Date(gift.gift_date).toLocaleDateString('sq-AL'),
    notes: gift.notes || '-'
  }))

  return (
    <div className="space-y-6">
 

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Buxheti Total</p>
            <p className="text-2xl font-bold text-gray-900">€{totalBudget.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">Planifikuar për dasmën</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Shpenzuar Deri Tani</p>
            <p className="text-2xl font-bold text-gray-900">€{totalSpent.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">{spentPercentage.toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Dhurata Marrë</p>
            <p className="text-2xl font-bold text-gray-900">€{totalGifts.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">{gifts.length} dhurata në total</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-xl hover:shadow-2xl transition-all ${
          remainingBudget >= 0 
            ? 'bg-gradient-to-br from-purple-50 to-pink-50' 
            : 'bg-gradient-to-br from-red-50 to-rose-50'
        }`}>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">
              {remainingBudget >= 0 ? 'Mbetur në Buxhet' : 'Mbi Buxhet'}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              €{Math.abs(remainingBudget).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {remainingBudget >= 0 ? 'Disponueshme' : 'Tejkaluar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress Card */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Përmbledhja e Buxhetit
              </CardTitle>
            </div>
            <Button asChild size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0">
              <Link href="/dashboard/budget/new">
                <Plus className="h-4 w-4 mr-2" />
                Shto Shpenzim
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progres i Shpenzimeve</span>
                <span className="text-sm font-bold text-gray-900">{spentPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all ${
                    spentPercentage > 100 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600' 
                      : spentPercentage > 75 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-green-600'
                  }`}
                  style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500">€0</span>
                <span className="text-xs text-gray-500">€{totalBudget.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">€{totalSpent.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Shpenzuar</div>
              </div>
              <div className="text-center border-x">
                <div className="text-2xl font-bold text-emerald-600">€{totalGifts.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Dhurata</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${netSpending > totalBudget ? 'text-red-600' : 'text-gray-900'}`}>
                  €{netSpending.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Neto</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-800">Përmbledhje Financiare</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              Transaksionet e Fundit
            </h3>
            
            {/* Combined recent transactions */}
            <div className="space-y-3">
              {[...expenses.slice(0, 3), ...vendors.slice(0, 2), ...gifts.slice(0, 2)]
                .sort((a, b) => new Date(b.created_at || b.gift_date).getTime() - new Date(a.created_at || a.gift_date).getTime())
                .slice(0, 5)
                .map((item, index) => {
                  const isExpense = 'payment_status' in item && !('deposit_paid' in item)
                  const isVendor = 'deposit_paid' in item
                  const isGift = 'gift_date' in item
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isGift ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {isGift ? (
                            <Gift className="h-5 w-5 text-green-600" />
                          ) : isVendor ? (
                            <Store className="h-5 w-5 text-red-600" />
                          ) : (
                            <Receipt className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {isExpense ? item.description : isVendor ? item.name : 'Dhuratë në para'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(item.created_at || item.gift_date).toLocaleDateString('sq-AL')}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${isGift ? 'text-green-600' : 'text-red-600'}`}>
                        {isGift ? '+' : '-'}€{Number(isGift ? item.amount : (isVendor ? item.deposit_amount : item.amount)).toLocaleString()}
                      </div>
                    </div>
                  )
                })}
            </div>

            {expenses.length === 0 && vendors.length === 0 && gifts.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nuk ka transaksione të regjistruara ende</p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/dashboard/budget/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Shto Transaksionin e Parë
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
