import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Gift } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

  // Get cash gifts
  const { data: gifts } = await supabase
    .from("cash_gifts")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("gift_date", { ascending: false })

  return (
    <DashboardLayout
      title="Bakshish & Dhurata"
      description="Gjurmoni dhe menaxhoni të gjitha dhuratat në para për dasmën tuaj"
      icon={Gift}
    >
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lista e Dhuratave në Para</CardTitle>
        </CardHeader>
        <CardContent>
          {gifts && gifts.length > 0 ? (
            <div className="space-y-4">
              {gifts.map((gift: any) => (
                <div key={gift.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">Shuma: ${gift.amount}</p>
                      <p className="text-sm text-gray-600">
                        Data: {new Date(gift.gift_date).toLocaleDateString('sq-AL')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nuk ka dhurata të regjistruara ende</p>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
