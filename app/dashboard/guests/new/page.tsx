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
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"

export default function NewGuestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
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
    groupInvite: false,
  })

  const [members, setMembers] = useState<Array<{ firstName: string; lastName: string }>>([])

  const addMember = () => setMembers((prev) => [...prev, { firstName: "", lastName: "" }])
  const removeMember = (idx: number) => setMembers((prev) => prev.filter((_, i) => i !== idx))
  const updateMember = (idx: number, field: "firstName" | "lastName", value: string) =>
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get current wedding via RLS (owner or collaborator)
      const { data: weddings } = await supabase
        .from("weddings")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1)

      if (!weddings || weddings.length === 0) {
        throw new Error("No wedding found")
      }

      const weddingId = weddings[0].id as string

      if (formData.groupInvite) {
        // 1) Create guest group
        const { data: groupRows, error: groupErr } = await supabase
          .from("guest_groups")
          .insert({ wedding_id: weddingId, name: null })
          .select("id")
          .single()
        if (groupErr) throw groupErr
        const groupId = groupRows.id as string

        // 2) Insert primary guest with group_id
        const { data: primaryRows, error: primErr } = await supabase
          .from("guests")
          .insert({
            wedding_id: weddingId,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email || null,
            phone: formData.phone || null,
            address: formData.address || null,
            guest_type: formData.guestType,
            dietary_restrictions: formData.dietaryRestrictions || null,
            plus_one_allowed: formData.plusOneAllowed,
            plus_one_name: formData.plusOneAllowed && formData.plusOneName ? formData.plusOneName : null,
            group_id: groupId,
          })
          .select("id")
          .single()
        if (primErr) throw primErr
        const primaryId = primaryRows.id as string

        // 3) Set primary_guest_id on group
        const { error: updErr } = await supabase
          .from("guest_groups")
          .update({ primary_guest_id: primaryId })
          .eq("id", groupId)
        if (updErr) throw updErr

        // 4) Insert member guests (flat list)
        if (members.length > 0) {
          const payload = members
            .filter((m) => m.firstName.trim() || m.lastName.trim())
            .map((m) => ({
              wedding_id: weddingId,
              first_name: m.firstName || "",
              last_name: m.lastName || "",
              guest_type: "adult",
              group_id: groupId,
            }))
          if (payload.length > 0) {
            const { error: memErr } = await supabase.from("guests").insert(payload)
            if (memErr) throw memErr
          }
        }
      } else {
        // Single guest
        const { error: insertError } = await supabase.from("guests").insert({
          wedding_id: weddingId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          guest_type: formData.guestType,
          dietary_restrictions: formData.dietaryRestrictions || null,
          plus_one_allowed: formData.plusOneAllowed,
          plus_one_name: formData.plusOneAllowed && formData.plusOneName ? formData.plusOneName : null,
        })
        if (insertError) throw insertError
      }

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
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Add New Guest</h1>
          <p className="text-muted-foreground">Add a guest to your wedding list</p>
        </div>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Guest Information</CardTitle>
            <CardDescription>Fill in the guest details</CardDescription>
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

              {/* Group Invitation */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="groupInvite"
                    checked={formData.groupInvite}
                    onCheckedChange={(checked) => handleInputChange("groupInvite", checked as boolean)}
                  />
                  <Label htmlFor="groupInvite">Group invitation (add multiple people under this guest)</Label>
                </div>

                {formData.groupInvite && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Add other people in this party. They will be counted as guests and included in the same invitation.</div>
                    {members.map((m, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <Input
                            placeholder="First name"
                            value={m.firstName}
                            onChange={(e) => updateMember(idx, "firstName", e.target.value)}
                          />
                        </div>
                        <div className="col-span-5">
                          <Input
                            placeholder="Last name"
                            value={m.lastName}
                            onChange={(e) => updateMember(idx, "lastName", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          <Button type="button" variant="outline" onClick={() => removeMember(idx)}>Remove</Button>
                        </div>
                      </div>
                    ))}
                    <Button type="button" variant="secondary" onClick={addMember}>Add Person</Button>
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
                  {isLoading ? "Adding..." : "Add Guest"}
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
