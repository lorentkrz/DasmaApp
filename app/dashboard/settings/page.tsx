import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, User, Bell, Shield, Palette, Globe } from "lucide-react"

export const dynamic = "force-dynamic"

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
      icon={Settings}
      gradientFrom="slate-50"
      gradientVia="gray-50"
      gradientTo="stone-50"
    >

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <User className="h-5 w-5 text-slate-600" />
                Profili im
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || ""}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Emri i plotë</Label>
                <Input
                  id="full_name"
                  value={profile?.full_name || ""}
                  placeholder="Shkruani emrin tuaj të plotë"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoni</Label>
                <Input
                  id="phone"
                  value={profile?.phone || ""}
                  placeholder="+383 XX XXX XXX"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600">
                Ruaj ndryshimet
              </Button>
            </CardContent>
          </Card>

          {/* Wedding Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Settings className="h-5 w-5 text-slate-600" />
                Cilësimet e dasmës
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bride_name">Emri i nuses</Label>
                <Input
                  id="bride_name"
                  value={wedding?.bride_name || ""}
                  placeholder="Emri i nuses"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groom_name">Emri i dhëndrit</Label>
                <Input
                  id="groom_name"
                  value={wedding?.groom_name || ""}
                  placeholder="Emri i dhëndrit"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wedding_date">Data e dasmës</Label>
                <Input
                  id="wedding_date"
                  type="date"
                  value={wedding?.wedding_date || ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venue">Vendi</Label>
                <Input
                  id="venue"
                  value={wedding?.venue || ""}
                  placeholder="Vendi i dasmës"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600">
                Ruaj ndryshimet
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Bell className="h-5 w-5 text-slate-600" />
                Njoftimet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Email njoftimet</p>
                  <p className="text-sm text-gray-600">Merrni email për ngjarje të rëndësishme</p>
                </div>
                <input type="checkbox" className="w-5 h-5 accent-slate-500 rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Njoftimet për detyra</p>
                  <p className="text-sm text-gray-600">Njoftimet për detyrat që afrohen</p>
                </div>
                <input type="checkbox" className="w-5 h-5 accent-slate-500 rounded" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Njoftimet për RSVP</p>
                  <p className="text-sm text-gray-600">Njoftimet kur mysafirët konfirmojnë</p>
                </div>
                <input type="checkbox" className="w-5 h-5 accent-slate-500 rounded" defaultChecked />
              </div>
              <Button className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600">
                Ruaj preferencat
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Shield className="h-5 w-5 text-slate-600" />
                Siguria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Fjalëkalimi aktual</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Shkruani fjalëkalimin aktual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Fjalëkalimi i ri</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Shkruani fjalëkalimin e ri"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmoni fjalëkalimin</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Konfirmoni fjalëkalimin e ri"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600">
                Ndrysho fjalëkalimin
              </Button>
            </CardContent>
          </Card>
        </div>
    </DashboardLayout>
  )
}
