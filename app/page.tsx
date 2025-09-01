import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Heart, Calendar, Users, CheckCircle } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Heart className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-balance mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Perfect Wedding
          </h1>
          <p className="text-xl text-muted-foreground text-balance mb-8 max-w-2xl mx-auto">
            Plan your dream wedding with our comprehensive management system. From guest lists to seating charts, we've
            got everything covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">Start Planning</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8 bg-transparent">
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Users className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Guest Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Manage your guest list, track RSVPs, and handle plus-ones with ease.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Seating Charts</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Create beautiful seating arrangements with our drag-and-drop interface.</CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Task Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Stay organized with our Kanban-style task board and never miss a deadline.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Budget Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Keep your wedding expenses on track with detailed budget management.</CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Planning?</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Join thousands of couples who have planned their perfect wedding with our platform.
            </p>
            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/auth/sign-up">Get Started Free</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
