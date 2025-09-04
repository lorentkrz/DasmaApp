import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { CashGiftsTracker } from "@/components/cash-gifts-tracker"

export default async function CashGiftsPage() {
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

  // Get guests for the cash gifts tracker
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("first_name", { ascending: true })

  return (
    <DashboardLayout
      title="Bakshish & Dhurata"
      description="Gjurmoni dhe menaxhoni të gjitha dhuratat në para për dasmën tuaj"
      icon="Gift"
    >
      <CashGiftsTracker weddingId={wedding.id} guests={guests || []} />
    </DashboardLayout>
  )
}
