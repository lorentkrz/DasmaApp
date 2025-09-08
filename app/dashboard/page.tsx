import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardEnterprise } from "@/components/dashboard-enterprise"

export async function generateMetadata() {
  return {
    title: 'Dashboard - Wedding ERP',
    description: 'Pamje e përgjithshme e dasmës'
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all data
  const [
    { data: guests },
    { data: tasks },
    { data: expenses },
    { data: vendors },
    { data: invitations },
    { data: cashGifts }
  ] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("tasks").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("expenses").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("vendors").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("invitations").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("cash_gifts").select("*").eq("wedding_id", currentWedding.id)
  ])

  return (
    <DashboardLayout
      title="Dashboard"
      description="Pamje e përgjithshme e dasmës"
      icon="Home"
    >
      <DashboardEnterprise 
        wedding={currentWedding}
        guests={guests || []}
        expenses={expenses || []}
        vendors={vendors || []}
        tasks={tasks || []}
        invitations={invitations || []}
        cashGifts={cashGifts || []}
      />
    </DashboardLayout>
  )
}
