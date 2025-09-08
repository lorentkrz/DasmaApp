import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { WeddingSettingsForm } from "@/components/wedding-settings-form"
import { ProfileSettingsForm } from "@/components/profile-settings-form"
import { NotificationSettingsForm } from "@/components/notification-settings-form"
import { SecuritySettingsForm } from "@/components/security-settings-form"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
  return {
    title: 'Cilësimet - Dasma ERP',
    description: 'Menaxhoni preferencat dhe cilësimet e llogarisë suaj'
  }
}

export default async function SettingsPage() {
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

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <DashboardLayout
      title="Cilësimet"
      description="Menaxhoni preferencat dhe cilësimet e llogarisë suaj"
      icon="Settings"
      gradientFrom="slate-50"
      gradientVia="gray-50"
      gradientTo="stone-50"
    >
      <div className="space-y-6">
        {/* Wedding Settings */}
        <WeddingSettingsForm wedding={wedding} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <ProfileSettingsForm user={user} profile={profile} />

          {/* Notification Settings */}
          <NotificationSettingsForm />

          {/* Security Settings */}
          <SecuritySettingsForm />
        </div>
      </div>
    </DashboardLayout>
  )
}
