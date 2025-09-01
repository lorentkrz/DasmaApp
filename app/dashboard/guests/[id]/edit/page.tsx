"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Edit } from "lucide-react"
import Link from "next/link"

export default function EditGuestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingGuest, setIsLoadingGuest] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    guestType: "adult",
    dietaryRestrictions: "",
    plusOneAllowed: false,
    plusOneName: "",
    rsvpStatus: "pending",
  })

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const { data: guest, error } = await supabase.from("guests").select("*").eq("id", params.id).single()

        if (error) throw error

        setFormData({
          firstName: guest.first_name,
          lastName: guest.last_name,
          email: guest.email || "",
          phone: guest.phone || "",
          address: guest.address || "",
          guestType: guest.guest_type,
          dietaryRestrictions: guest.dietary_restrictions || "",
          plusOneAllowed: guest.plus_one_allowed,
          plusOneName: guest.plus_one_name || "",
          rsvpStatus: guest.rsvp_status,
        })
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "Failed to load guest")
      } finally {
        setIsLoadingGuest(false)
      }
    }

    if (params.id) {
      fetchGuest()
    }
  }, [params.id, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("guests")
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          guest_type: formData.guestType,
          dietary_restrictions: formData.dietaryRestrictions || null,
          plus_one_allowed: formData.plusOneAllowed,
          plus_one_name: formData.plusOneAllowed && formData.plusOneName ? formData.plusOneName : null,
          rsvp_status: formData.rsvpStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (updateError) throw updateError

      router.push("/dashboard/guests")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (isLoadingGuest) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Loading guest information...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/guests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Guests
            </Link>
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Edit className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Edit Guest</h1>
          <p className="text-muted-foreground">Update guest information</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
            <CardDescription>Update the guest details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestType">Guest Type</Label>
                  <Select value={formData.guestType} onValueChange={(value) => handleInputChange("guestType", value)}>
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult">Adult</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="infant">Infant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rsvpStatus">RSVP Status</Label>
                  <Select value={formData.rsvpStatus} onValueChange={(value) => handleInputChange("rsvpStatus", value)}>
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="attending">Attending</SelectItem>
                      <SelectItem value="not_attending">Not Attending</SelectItem>
                      <SelectItem value="maybe">Maybe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Dietary Restrictions</Label>
                <Textarea
                  id="dietaryRestrictions"
                  placeholder="Any dietary restrictions or allergies"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="plusOneAllowed"
                    checked={formData.plusOneAllowed}
                    onCheckedChange={(checked) => handleInputChange("plusOneAllowed", checked as boolean)}
                  />
                  <Label htmlFor="plusOneAllowed">Allow plus one</Label>
                </div>

                {formData.plusOneAllowed && (
                  <div className="space-y-2">
                    <Label htmlFor="plusOneName">Plus One Name (if known)</Label>
                    <Input
                      id="plusOneName"
                      type="text"
                      placeholder="Plus one's name"
                      value={formData.plusOneName}
                      onChange={(e) => handleInputChange("plusOneName", e.target.value)}
                      className="border-primary/20 focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Updating..." : "Update Guest"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/dashboard/guests">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
