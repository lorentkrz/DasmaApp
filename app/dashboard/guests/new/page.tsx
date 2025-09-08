import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuestForm } from "@/components/guest-form"

export default async function NewGuestPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Get current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch tables for table assignment
  const { data: tables } = await supabase
    .from("wedding_tables")
    .select("*")
    .eq("wedding_id", currentWedding.id)
    .order("table_number", { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <GuestForm weddingId={currentWedding.id} tables={tables || []} />
      </div>
    </div>
  )
}
