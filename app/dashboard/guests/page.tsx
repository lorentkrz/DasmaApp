import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GuestList } from "@/components/guest-list"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, CheckCircle, Clock, X, Download, Upload } from "lucide-react"
import Link from "next/link"

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
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) {
    redirect("/dashboard/weddings/new")
  }

  const currentWedding = weddings[0]

  // Fetch all guests for the current wedding
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", currentWedding.id)
    .order("last_name", { ascending: true })

  // Calculate stats
  const stats = {
    total: guests?.length || 0,
    attending: guests?.filter((g) => g.rsvp_status === "attending").length || 0,
    notAttending: guests?.filter((g) => g.rsvp_status === "not_attending").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
    maybe: guests?.filter((g) => g.rsvp_status === "maybe").length || 0,
    plusOnes: guests?.filter((g) => g.plus_one_allowed && g.plus_one_name).length || 0,
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Guest Management</h1>
          <p className="text-muted-foreground">
            Manage your guest list for {currentWedding.bride_name} & {currentWedding.groom_name}'s wedding
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/guests/import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/guests/export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/guests/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guest
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attending</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maybe</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.maybe}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Not Attending</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.notAttending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plus Ones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.plusOnes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Guest List */}
      <Card>
        <CardHeader>
          <CardTitle>Guest List</CardTitle>
          <CardDescription>Manage your wedding guests and track their RSVP status</CardDescription>
        </CardHeader>
        <CardContent>
          <GuestList guests={guests || []} weddingId={currentWedding.id} />
        </CardContent>
      </Card>
    </div>
  )
}
