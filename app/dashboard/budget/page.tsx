import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { FinancialOverviewRefactored } from "@/components/financial-overview-refactored"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
  return {
    title: 'Financat e Dasmës - Dasma ERP',
    description: 'Menaxhoni buxhetin dhe shpenzimet e dasmës suaj'
  }
}

export default async function BudgetPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]
  if (!wedding) redirect("/dashboard/weddings/new")

  // Get all financial data in parallel
  const [
    { data: expenses },
    { data: categories },
    { data: gifts },
    { data: vendors }
  ] = await Promise.all([
    supabase
      .from("expenses")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: false }),
    
    supabase
      .from("budget_categories")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: true }),
    
    supabase
      .from("cash_gifts")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("gift_date", { ascending: false }),
    
    supabase
      .from("vendors")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: false })
  ])

  return (
    <FinancialOverviewRefactored 
      wedding={wedding}
      expenses={expenses || []}
      categories={categories || []}
      gifts={gifts || []}
      vendors={vendors || []}
    />
  )
}
