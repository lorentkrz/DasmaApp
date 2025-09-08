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

  console.log('Getting weddings for user:', user.id)
  
  // Get accessible wedding (RLS enforces access)
  const { data: weddings, error: weddingError } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  console.log('Weddings query result:', { data: weddings, error: weddingError })
  
  if (weddingError) {
    console.error('Error fetching weddings:', weddingError)
    throw weddingError
  }

  const wedding = weddings?.[0]
  console.log('Found wedding:', wedding?.id)

  if (!wedding) {
    console.log('No wedding found, redirecting to new wedding page')
    redirect("/dashboard/weddings/new")
  }

  // Get vendors
  console.log('Fetching vendors for wedding:', wedding.id)
  const { data: vendors, error: vendorError } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })
    
  if (vendorError) {
    console.error('Error fetching vendors:', vendorError)
    throw vendorError
  }
  
  console.log(`Found ${vendors?.length || 0} vendors`)

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
