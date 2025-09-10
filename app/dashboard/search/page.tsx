import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function SearchPage({ searchParams }: { searchParams?: { q?: string; scope?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const q = (searchParams?.q || "").trim()
  const scope = (searchParams?.scope || "all").toLowerCase()
  if (!q) {
    return (
      <DashboardLayout title="Kërkim" description="Kërkoni te mysafirët dhe shitësit" icon="Search">
        <div className="glass rounded-lg density-card border border-white/10">
          Shkruani një term kërkimi në shiritin lart.
        </div>
      </DashboardLayout>
    )
  }

  // Current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]
  if (!wedding) redirect("/dashboard/weddings/new")

  // Guests search
  const guestsQuery = supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`
    )
    .limit(20)

  // Vendors search
  const vendorsQuery = supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .or(
      `name.ilike.%${q}%,company.ilike.%${q}%,contact_person.ilike.%${q}%,phone.ilike.%${q}%`
    )
    .limit(20)

  // Invitations search (filter by guest or group names)
  const invitationsQuery = supabase
    .from("invitations")
    .select(`*, guest:guests(*), group:guest_groups(*)`)
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })

  const [guestsRes, vendorsRes, invitationsRes] = await Promise.all([
    scope === "vendors" ? { data: [], error: null } : guestsQuery,
    scope === "guests" ? { data: [], error: null } : vendorsQuery,
    invitationsQuery,
  ])

  const guests = (guestsRes.data || [])
  const vendors = (vendorsRes.data || [])
  const allInvitations = (invitationsRes.data || []) as any[]
  const invitations = allInvitations.filter((inv: any) => {
    const g = inv.guest
    const name = g ? `${g.first_name || ""} ${g.last_name || ""}`.toLowerCase() : (inv.group?.name || "").toLowerCase()
    return name.includes(q.toLowerCase())
  }).slice(0, 20)

  return (
    <DashboardLayout
      title="Kërkim"
      description={`Rezultatet për: "${q}"`}
      icon="Search"
    >
      <div className="space-y-6">
        {/* Guests */}
        {(scope === "all" || scope === "guests") && (
          <Card className="glass border border-white/10">
            <CardHeader>
              <CardTitle>Mysafirët ({guests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {guests.length === 0 ? (
                <div className="text-sm text-gray-600">S'u gjet asnjë mysafir.</div>
              ) : (
                <ul className="space-y-2">
                  {guests.map((g: any) => (
                    <li key={g.id} className="flex items-center justify-between p-2 rounded-md bg-white/50 dark:bg-white/10 border border-white/20">
                      <div className="truncate">
                        <div className="font-medium">{g.first_name} {g.last_name}</div>
                        <div className="text-xs text-gray-600">{g.phone || g.email || ""}</div>
                      </div>
                      <Link href={`/dashboard/guests/${g.id}/edit`} className="text-sm text-blue-600 hover:underline">Hap</Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Vendors */}
        {(scope === "all" || scope === "vendors") && (
          <Card className="glass border border-white/10">
            <CardHeader>
              <CardTitle>Shitësit ({vendors.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="text-sm text-gray-600">S'u gjet asnjë shitës.</div>
              ) : (
                <ul className="space-y-2">
                  {vendors.map((v: any) => (
                    <li key={v.id} className="flex items-center justify-between p-2 rounded-md bg-white/50 dark:bg-white/10 border border-white/20">
                      <div className="truncate">
                        <div className="font-medium">{v.name}</div>
                        <div className="text-xs text-gray-600">{v.company || v.contact_person || ""}</div>
                      </div>
                      <Link href={`/dashboard/vendors/${v.id}/edit`} className="text-sm text-blue-600 hover:underline">Hap</Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invitations */}
        {scope === "all" && (
          <Card className="glass border border-white/10">
            <CardHeader>
              <CardTitle>Ftesat ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-sm text-gray-600">S'u gjet asnjë ftesë.</div>
              ) : (
                <ul className="space-y-2">
                  {invitations.map((inv: any) => (
                    <li key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-white/50 dark:bg-white/10 border border-white/20">
                      <div className="truncate">
                        <div className="font-medium">
                          {inv.guest ? `${inv.guest.first_name} ${inv.guest.last_name}` : (inv.group?.name || "Ftesë")}
                        </div>
                        <div className="text-xs text-gray-600">{inv.sent_at ? "Dërguar" : "Pa dërguar"}</div>
                      </div>
                      <Link href={`/dashboard/invitations`} className="text-sm text-blue-600 hover:underline">Hap</Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
