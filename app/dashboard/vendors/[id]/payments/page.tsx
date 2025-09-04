import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorPaymentList } from "@/components/vendor-payment-list"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function VendorPaymentsPage({ params }: { params: { id: string } }) {
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

  // Get vendor details
  const { data: vendor } = await supabase
    .from("vendors")
    .select("*")
    .eq("id", params.id)
    .eq("wedding_id", wedding.id)
    .single()

  if (!vendor) {
    redirect("/dashboard/vendors")
  }

  return (
    <DashboardLayout
      title={`Pagesat - ${vendor.name}`}
      description="Menaxhoni pagesat dhe ndjekni progresin e pagesave për këtë shitës"
      icon="CreditCard"
      actions={
        <Button asChild variant="outline">
          <Link href="/dashboard/vendors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kthehu te Shitësit
          </Link>
        </Button>
      }
    >
      <VendorPaymentList vendor={vendor} wedding={wedding} />
    </DashboardLayout>
  )
}
