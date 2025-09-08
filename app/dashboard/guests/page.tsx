import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuestListEnterprise } from "@/components/guest-list-enterprise"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Download, Upload } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export async function generateMetadata() {
  return {
    title: 'Mysafirët - Dasma ERP',
    description: 'Menaxhoni listën e mysafirëve për dasmën tuaj'
  }
}

export default async function GuestsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get accessible wedding (RLS enforces access)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  console.log('User ID:', user.id)
  console.log('Weddings found:', weddings?.length || 0)
  console.log('Weddings error:', null)

  if (!weddings || weddings.length === 0) {
    console.log('No weddings found, redirecting to new wedding page')
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]
  console.log('Current wedding:', currentWedding.id, currentWedding.bride_name, currentWedding.groom_name)

  // Fetch guests and groups in parallel
  const [
    { data: guests, error: guestsError },
    { data: groups }
  ] = await Promise.all([
    // Fetch only necessary guest fields with invitation data
    supabase
      .from("guests")
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        group_id,
        rsvp_status,
        created_at,
        invitations!inner(id, token, sent_at, opened_at, responded_at)
      `)
      .eq("wedding_id", currentWedding.id)
      .order("created_at", { ascending: false }),
      
    // Fetch only necessary group fields
    supabase
      .from("guest_groups")
      .select("id, name, description")
      .eq("wedding_id", currentWedding.id)
  ])

  // Stats are now calculated in the refactored component

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Menaxhimi i Mysafirëve</h1>
              <p className="text-sm text-gray-600 mt-1">
                Dasma e {currentWedding.groom_name} & {currentWedding.bride_name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/guests/import">
                  <Upload className="h-3 w-3 mr-1" />
                  Importo
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/guests/export">
                  <Download className="h-3 w-3 mr-1" />
                  Eksporto
                </Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white">
                <Link href="/dashboard/guests/new">
                  <UserPlus className="h-3 w-3 mr-1" />
                  Shto Mysafir
                </Link>
              </Button>
            </div>
          </div>
        </div>


        {/* Guest List Component */}
        {guestsError ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-2">Error loading guests</div>
              <p className="text-sm text-gray-600">{guestsError.message}</p>
            </CardContent>
          </Card>
        ) : (
          <GuestListEnterprise guests={guests || []} groups={groups || []} />
        )}
      </div>
    </div>
  )
}
