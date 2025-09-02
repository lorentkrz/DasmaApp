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

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-8 px-4 md:px-6 pt-6 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
                Buxheti & Shpenzimet
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-lg">
                Menaxhoni buxhetin dhe shpenzimet për dasmën tuaj të ëndërruar
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <BudgetAddButton wedding={wedding} categories={categories || []} />
          </div>
        </div>

        <BudgetOverview wedding={wedding} expenses={expenses || []} categories={categories || []} gifts={gifts || []} />
        <BudgetExpenseList wedding={wedding} expenses={expenses || []} categories={categories || []} />
      </div>
    </div>
  )
}
