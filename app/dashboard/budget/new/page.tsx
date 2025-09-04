import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
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
    <DashboardLayout
      title="Shto Shpenzim të Ri"
      description="Regjistroni një shpenzim manual për dasmën tuaj"
      icon="Plus"
    >
      <div className="max-w-2xl mx-auto">
        <ExpenseForm wedding={wedding} categories={categories || []} />
      </div>
    </DashboardLayout>
  )
}
