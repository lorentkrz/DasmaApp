import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorListWrapper } from "@/components/vendor-list-wrapper"
import { VendorAddButton } from "@/components/vendor-add-button"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Store } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VendorsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get current wedding (RLS-safe: rely on policies and pick most recent)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]

  if (!wedding) redirect("/dashboard/weddings/new")

  // Get vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout
      title="Shitësit & Kontratat"
      description="Menaxhoni shitësit dhe kontratat për dasmën tuaj të ëndërruar"
      icon="Store"
      actions={<VendorAddButton wedding={wedding} />}
    >
      <VendorListWrapper wedding={wedding} vendors={vendors || []} />
    </DashboardLayout>
  )
}
