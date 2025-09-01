import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorListWrapper } from "@/components/vendor-list-wrapper"
import { VendorAddButton } from "@/components/vendor-add-button"

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
    <div className="space-y-6 px-4 md:px-6 pt-2">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Vendors</h1>
          <p className="text-sm text-slate-600">Manage your wedding vendors and contracts</p>
        </div>
        <VendorAddButton wedding={wedding} />
      </div>

      <VendorListWrapper wedding={wedding} vendors={vendors || []} />
    </div>
  )
}
