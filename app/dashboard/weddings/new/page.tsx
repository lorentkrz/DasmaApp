"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Heart, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewWeddingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    brideName: "",
    groomName: "",
    weddingDate: "",
    venueName: "",
    venueAddress: "",
    guestCountEstimate: "",
    budgetTotal: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error: insertError } = await supabase.from("weddings").insert({
        owner_id: user.id,
        bride_name: formData.brideName,
        groom_name: formData.groomName,
        wedding_date: formData.weddingDate,
        venue_name: formData.venueName || null,
        venue_address: formData.venueAddress || null,
        guest_count_estimate: formData.guestCountEstimate ? Number.parseInt(formData.guestCountEstimate) : 0,
        budget_total: formData.budgetTotal ? Number.parseFloat(formData.budgetTotal) : 0,
      })

      if (insertError) throw insertError

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Create Your Wedding</h1>
            <p className="text-muted-foreground">Let's start planning your perfect day by setting up the basics</p>
          </div>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Wedding Details</CardTitle>
              <CardDescription>Fill in the essential information about your wedding</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brideName">Bride's Name *</Label>
                    <Input
                      id="brideName"
                      type="text"
                      required
                      value={formData.brideName}
                      onChange={(e) => handleInputChange("brideName", e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groomName">Groom's Name *</Label>
                    <Input
                      id="groomName"
                      type="text"
                      required
                      value={formData.groomName}
                      onChange={(e) => handleInputChange("groomName", e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weddingDate">Wedding Date *</Label>
                  <Input
                    id="weddingDate"
                    type="date"
                    required
                    value={formData.weddingDate}
                    onChange={(e) => handleInputChange("weddingDate", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    type="text"
                    placeholder="e.g., Grand Ballroom"
                    value={formData.venueName}
                    onChange={(e) => handleInputChange("venueName", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venueAddress">Venue Address</Label>
                  <Textarea
                    id="venueAddress"
                    placeholder="Full venue address"
                    value={formData.venueAddress}
                    onChange={(e) => handleInputChange("venueAddress", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guestCountEstimate">Estimated Guest Count</Label>
                    <Input
                      id="guestCountEstimate"
                      type="number"
                      min="0"
                      placeholder="e.g., 150"
                      value={formData.guestCountEstimate}
                      onChange={(e) => handleInputChange("guestCountEstimate", e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budgetTotal">Total Budget</Label>
                    <Input
                      id="budgetTotal"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="e.g., 25000"
                      value={formData.budgetTotal}
                      onChange={(e) => handleInputChange("budgetTotal", e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? "Creating..." : "Create Wedding"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/dashboard">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
