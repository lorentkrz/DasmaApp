import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ExpenseForm } from "@/components/expense-form"

export const dynamic = "force-dynamic"

interface PageProps {
  params: { id: string }
}

export default async function EditExpensePage({ params }: PageProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Load the expense by id (RLS enforces access)
  const { data: expense, error: expErr } = await supabase.from("expenses").select("*").eq("id", params.id).single()

  if (expErr || !expense) {
    // Not found or not accessible
    redirect("/dashboard/budget")
  }

  // Load the wedding that the expense belongs to (RLS applies here too)
  const { data: wedding } = await supabase.from("weddings").select("*").eq("id", expense.wedding_id).single()
  if (!wedding) redirect("/dashboard/budget")

  // Load categories for this wedding
  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id,name")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: true })

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 md:px-0 pt-2">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Edit Expense</h1>
        <p className="text-sm text-slate-600">Update details for this expense</p>
      </div>

      <ExpenseForm wedding={wedding} expense={expense} categories={categories || []} />
    </div>
  )
}
