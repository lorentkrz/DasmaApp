import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExpenseForm } from "@/components/expense-form"

export const dynamic = "force-dynamic"

export default async function NewExpensePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]

  if (!wedding) redirect("/dashboard/weddings/new")

  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id,name")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0 pt-2">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Add New Expense</h1>
        <p className="text-sm text-slate-600">Track a new wedding expense</p>
      </div>

      <ExpenseForm wedding={wedding} categories={categories || []} />
    </div>
  )
}
