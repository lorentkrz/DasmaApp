import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuestListEnterprise } from "@/components/guest-list-enterprise"
import { GuestAddButton } from "@/components/guest-add-button"
import { GuestListWrapper } from "@/components/guest-list-wrapper"
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

  // Get accessible wedding (RLS enforces access) with debug info
  const { data: weddings, error: weddingsError } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all guests for the current wedding with invitation data
  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select(`
      *,
      invitations(id, token, sent_at, opened_at, responded_at)
    `)
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Fetch all groups for the wedding
  const { data: groups } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("wedding_id", currentWedding.id)

  // Stats are now calculated in the refactored component

  return (
    <div className="min-h-screen bg-[var(--bg)] dark:bg-[var(--bg-dark)]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="glass rounded-lg border p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">Menaxhimi i Mysafirëve</h1>
              <p className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)] mt-1">
                Dasma e {currentWedding.groom_name} & {currentWedding.bride_name}
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/guests/import">
                  Import
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/guests/export">
                  Export
                </Link>
              </Button>
              <GuestAddButton weddingId={currentWedding.id} />
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
          <GuestListWrapper wedding={currentWedding} guests={guests || []} groups={groups || []} />
        )}
      </div>
    </div>
  )
}
