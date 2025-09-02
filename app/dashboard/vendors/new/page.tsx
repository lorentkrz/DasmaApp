import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorForm } from "@/components/vendor-form"

export default async function NewVendorPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: wedding } = await supabase.from("weddings").select("*").eq("user_id", user.id).single()

  if (!wedding) redirect("/dashboard/weddings/new")

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Shto Ofrues të Ri</h1>
        <p className="text-gray-600">Shtoni një ofrues shërbimi në ekipin tuaj të dasmës</p>
      </div>

      <VendorForm wedding={wedding} />
    </div>
  )
}
