import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Users, Calendar, DollarSign, CheckCircle, Clock, AlertCircle, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch accessible weddings (RLS enforces owner or collaborator)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  // If no weddings, show onboarding
  if (!weddings || weddings.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Heart className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome to Your Wedding Journey
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Let's start planning your perfect day! Create your first wedding to begin organizing everything.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/dashboard/weddings/new">
                <Plus className="h-5 w-5 mr-2" />
                Create Your Wedding
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Get the most recent wedding for dashboard stats
  const currentWedding = weddings[0]

  // Fetch dashboard stats for the current wedding
  const [{ data: guests }, { data: tasks }, { data: vendors }, { data: expenses }] = await Promise.all([
    supabase.from("guests").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("tasks").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("vendors").select("*").eq("wedding_id", currentWedding.id),
    supabase.from("expenses").select("amount").eq("wedding_id", currentWedding.id),
  ])

  // Calculate stats
  const guestStats = {
    total: guests?.length || 0,
    confirmed: guests?.filter((g) => g.rsvp_status === "attending").length || 0,
    pending: guests?.filter((g) => g.rsvp_status === "pending").length || 0,
  }

  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter((t) => t.completed).length || 0,
    overdue: tasks?.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < new Date()).length || 0,
  }

  const vendorStats = {
    total: vendors?.length || 0,
    booked: vendors?.filter((v) => v.status === "booked").length || 0,
  }

  const totalSpent = expenses?.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0) || 0
  const budgetProgress = currentWedding.budget_total > 0 ? (totalSpent / currentWedding.budget_total) * 100 : 0

  const daysUntilWedding = Math.ceil(
    (new Date(currentWedding.wedding_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-balance mb-2">
              {currentWedding.bride_name} & {currentWedding.groom_name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(currentWedding.wedding_date).toLocaleDateString()}</span>
              </div>
              <Badge variant={daysUntilWedding > 30 ? "secondary" : daysUntilWedding > 7 ? "default" : "destructive"}>
                {daysUntilWedding > 0 ? `${daysUntilWedding} days to go` : "Wedding Day!"}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {weddings.length > 1 && (
              <Button variant="outline" asChild>
                <Link href="/dashboard/weddings">Switch Wedding</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/dashboard/weddings/new">
                <Plus className="h-4 w-4 mr-2" />
                New Wedding
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {guestStats.confirmed}/{guestStats.total}
              </div>
              <p className="text-xs text-muted-foreground">{guestStats.pending} pending responses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {taskStats.completed}/{taskStats.total}
              </div>
              <p className="text-xs text-muted-foreground">
                {taskStats.overdue > 0 && <span className="text-destructive">{taskStats.overdue} overdue</span>}
                {taskStats.overdue === 0 && "All on track"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendors</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {vendorStats.booked}/{vendorStats.total}
              </div>
              <p className="text-xs text-muted-foreground">vendors booked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
              <Progress value={budgetProgress} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                of ${currentWedding.budget_total?.toLocaleString() || 0} budget
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/guests">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Manage Guests
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Add guests, track RSVPs, and manage seating</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/tasks">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Task Board
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Track your wedding planning progress</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/budget">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Budget Tracker
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Monitor expenses and stay on budget</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/vendors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Vendors
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Manage your wedding service providers</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/seating">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Seating Chart
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Design your reception seating arrangement</CardDescription>
              </CardHeader>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/invitations">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Invitations
                  <ArrowRight className="h-4 w-4" />
                </CardTitle>
                <CardDescription>Send invites and track responses</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates on your wedding planning</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taskStats.overdue > 0 && (
                <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium text-destructive">Overdue Tasks</p>
                    <p className="text-sm text-muted-foreground">
                      You have {taskStats.overdue} overdue task{taskStats.overdue > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )}

              {guestStats.pending > 0 && (
                <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                  <Clock className="h-5 w-5 text-accent" />
                  <div>
                    <p className="font-medium">Pending RSVPs</p>
                    <p className="text-sm text-muted-foreground">
                      {guestStats.pending} guest{guestStats.pending > 1 ? "s" : ""} haven't responded yet
                    </p>
                  </div>
                </div>
              )}

              {taskStats.overdue === 0 && guestStats.pending === 0 && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">All Caught Up!</p>
                    <p className="text-sm text-muted-foreground">No overdue tasks or pending items. Great job!</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
