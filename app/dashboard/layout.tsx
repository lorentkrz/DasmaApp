import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardSidebarEnterprise } from "@/components/dashboard-sidebar-enterprise"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Merr profilin e përdoruesit
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Merr dasmat e përdoruesit për navigim
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, bride_name, groom_name, wedding_date")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="flex h-screen bg-gray-50">
      <DashboardSidebarEnterprise weddings={weddings || []} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
