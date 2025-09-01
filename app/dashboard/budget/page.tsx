import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BudgetOverview } from "@/components/budget-overview"
import { ExpenseList } from "@/components/expense-list"
import { BudgetAddButton } from "@/components/budget-add-button"
import { BudgetExpenseList } from "@/components/budget-expense-list"
// removed unused imports

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
    <div className="space-y-6 px-4 md:px-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Budget & Expenses</h1>
          <p className="text-sm text-slate-600">Track your wedding budget and expenses</p>
        </div>
        <BudgetAddButton wedding={wedding} categories={categories || []} />
      </div>

      <BudgetOverview wedding={wedding} expenses={expenses || []} categories={categories || []} gifts={gifts || []} />
      <BudgetExpenseList wedding={wedding} expenses={expenses || []} categories={categories || []} />
    </div>
  )
}
