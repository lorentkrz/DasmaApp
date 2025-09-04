"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  TrendingUp, 
  Gift, 
  CheckCircle, 
  AlertTriangle, 
  Receipt,
  Calendar,
  User,
  Building,
  CreditCard,
  Store
} from 'lucide-react'

interface FinancialOverviewProps {
  wedding: any
  expenses: any[]
  categories: any[]
  gifts: any[]
  vendors: any[]
}

export function FinancialOverview({ wedding, expenses, categories, gifts, vendors }: FinancialOverviewProps) {
  // Calculate totals
  const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) +
    vendors.filter(v => v.deposit_amount > 0).reduce((sum, vendor) => sum + Number(vendor.deposit_amount || 0), 0)
  
  const totalGifts = gifts.reduce((sum, gift) => sum + Number(gift.amount || 0), 0)
  const netSpending = totalSpent - totalGifts
  
  // Calculate budget totals - use budget_total (original column)
  const totalBudget = Number(wedding.budget_total || 0)
  const remainingBudget = totalBudget - totalSpent
  const spentPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  
  // Combine all financial items
  const allFinancialItems = [
    // Manual expenses
    ...expenses.map(exp => ({
      ...exp,
      type: 'expense',
      displayName: exp.description,
      amount: exp.amount,
      status: exp.payment_status || 'pending',
      date: exp.created_at || exp.date
    })),
    // Vendor deposits (only show actual money spent)
    ...vendors.filter(v => v.deposit_paid && v.deposit_amount > 0).map(vendor => ({
      ...vendor,
      type: 'vendor',
      displayName: `${vendor.name} - Depozitë`,
      amount: vendor.deposit_amount,
      status: 'deposit_paid',
      date: vendor.created_at
    })),
    // Cash gifts
    ...gifts.map(gift => ({
      ...gift,
      type: 'gift',
      displayName: `Dhuratë në para`,
      amount: gift.amount,
      status: 'received',
      date: gift.gift_date
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getStatusColor = (type: string, status: string) => {
    if (type === 'gift') return 'bg-green-100 text-green-800'
    if (status === 'paid' || status === 'deposit_paid') return 'bg-green-100 text-green-800'
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (type: string, status: string) => {
    if (type === 'gift') return 'Marrë'
    if (status === 'paid') return 'Paguar'
    if (status === 'deposit_paid') return 'Depozitë Paguar'
    if (status === 'pending') return 'Në pritje'
    return status
  }

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Buxheti i Planifikuar</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">€{totalBudget.toLocaleString()}</div>
            <div className="text-xs text-blue-600">Buxheti total</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Para të Shpenzuara</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">€{totalSpent.toLocaleString()}</div>
            <div className="text-xs text-red-600">Shpenzime + Depozita</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Dhurata Marrë</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">€{totalGifts.toLocaleString()}</div>
            <div className="text-xs text-green-600">{gifts.length} dhurata</div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${remainingBudget >= 0 ? 'from-emerald-50 to-green-100 border-emerald-200' : 'from-red-50 to-rose-100 border-red-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${remainingBudget >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {remainingBudget >= 0 ? 'Mbetur nga Buxheti' : 'Tejkaluar Buxhetin'}
            </CardTitle>
            {remainingBudget >= 0 ? 
              <CheckCircle className="h-4 w-4 text-emerald-600" /> : 
              <AlertTriangle className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>
              €{Math.abs(remainingBudget).toLocaleString()}
            </div>
            <div className={`text-xs ${remainingBudget >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {spentPercentage.toFixed(1)}% e buxhetit
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progresi i Buxhetit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>€{totalSpent.toLocaleString()} shpenzuar</span>
                <span>€{totalBudget.toLocaleString()} buxhet</span>
              </div>
              <Progress value={Math.min(spentPercentage, 100)} className="w-full h-3" />
            </div>
            
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Të Gjitha ({allFinancialItems.length})</TabsTrigger>
          <TabsTrigger value="expenses">Shpenzime ({expenses.length})</TabsTrigger>
          <TabsTrigger value="vendors">Shitës ({vendors.length})</TabsTrigger>
          <TabsTrigger value="gifts">Dhurata ({gifts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Të Gjitha Transaksionet Financiare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {allFinancialItems.map((item, index) => (
                  <div key={`${item.type}-${item.id}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{item.displayName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getStatusColor(item.type, item.status)}>
                              {getStatusText(item.type, item.status)}
                            </Badge>
                            <Badge variant="outline">
                              {item.type === 'expense' ? 'Shpenzim' : 
                               item.type === 'vendor' ? 'Kontratë' : 'Dhuratë'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(item.date).toLocaleDateString('sq-AL')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${item.type === 'gift' ? 'text-green-600' : 'text-red-600'}`}>
                        {item.type === 'gift' ? '+' : '-'}€{Number(item.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {allFinancialItems.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Asnjë transaksion financiar i regjistruar ende
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Shpenzimet Manuale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{expense.description}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor('expense', expense.payment_status)}>
                          {getStatusText('expense', expense.payment_status)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(expense.created_at).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -€{Number(expense.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Asnjë shpenzim manual i regjistruar ende
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Kontratat e Shitësve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{vendor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={getStatusColor('vendor', vendor.deposit_paid ? 'deposit_paid' : 'pending')}>
                          {vendor.deposit_paid ? 'Depozitë Paguar' : 'Në pritje'}
                        </Badge>
                        <Badge variant="outline">{vendor.category}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(vendor.created_at).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                      {vendor.deposit_amount > 0 && (
                        <div className="text-sm text-gray-600 mt-1">
                          Depozitë: €{Number(vendor.deposit_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        -€{Number(vendor.deposit_amount || 0).toLocaleString()}
                      </div>
                      {vendor.contract_amount && (
                        <div className="text-sm text-gray-500">
                          Kontratë: €{Number(vendor.contract_amount).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {vendors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Asnjë shitës i regjistruar ende
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Dhurata në Para
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gifts.map((gift) => (
                  <div key={gift.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">Dhuratë në para</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Marrë
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(gift.gift_date).toLocaleDateString('sq-AL')}
                        </span>
                      </div>
                      {gift.notes && (
                        <div className="text-sm text-gray-600 mt-1">
                          {gift.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        +€{Number(gift.amount).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {gifts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Asnjë dhuratë në para e regjistruar ende
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
