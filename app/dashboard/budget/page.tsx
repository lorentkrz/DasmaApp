import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BudgetOverview } from "@/components/budget-overview"
import { ExpenseList } from "@/components/expense-list"
import { BudgetAddButton } from "@/components/budget-add-button"
import { BudgetExpenseList } from "@/components/budget-expense-list"
import { Heart, Sparkles, DollarSign } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BudgetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get current wedding (accessible via RLS: owner or collaborator)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]

  if (!wedding) redirect("/dashboard/weddings/new")

  // Get budget categories and expenses
  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })

  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id,name,budgeted_amount,color")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: true })

  // Get cash gifts (Bakshish)
  const { data: gifts } = await supabase
    .from("cash_gifts")
    .select("id, amount, gift_date, guest_id")
    .eq("wedding_id", wedding.id)
    .order("gift_date", { ascending: false })

  // Get vendor contracts
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name, contract_amount, deposit_amount, deposit_paid, status, category_id, contact_date")
    .eq("wedding_id", wedding.id)
    .in("status", ["booked", "contacted"]) // Only include active vendors

  // Combine all spending sources into unified expense list
  const allExpenses = [
    // Manual expenses
    ...(expenses || []).map(expense => ({
      ...expense,
      source: 'manual',
      date: expense.created_at || expense.date
    })),
    // Vendor contracts as expenses
    ...(vendors || []).map(vendor => ({
      id: `vendor-${vendor.id}`,
      description: `${vendor.name} - Kontratë`,
      amount: vendor.contract_amount,
      category_id: vendor.category_id,
      vendor: vendor.name,
      date: vendor.contact_date || new Date().toISOString(),
      payment_status: vendor.deposit_paid ? 'paid' : 'pending',
      notes: `Depozitë: $${vendor.deposit_amount || 0}`,
      source: 'vendor'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/15 to-rose-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* Enhanced Header - Mobile Responsive */}
        <div className="flex flex-col space-y-4 mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                Buxheti & Shpenzimet
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-base md:text-lg">
                Menaxhoni buxhetin dhe shpenzimet për dasmën tuaj të ëndërruar
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
            <BudgetAddButton wedding={wedding} categories={categories || []} />
          </div>
        </div>

        <BudgetOverview wedding={wedding} expenses={expenses || []} categories={categories || []} gifts={gifts || []} vendors={vendors || []} />
        <BudgetExpenseList wedding={wedding} expenses={allExpenses} categories={categories || []} />
      </div>
    </div>
  )
}
