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
    rsvpStatus: "pending",
    groupInvite: false,
  })

  const [members, setMembers] = useState<Array<{ id?: string; firstName: string; lastName: string; guestType: string }>>([])  
  const [originalGroupId, setOriginalGroupId] = useState<string | null>(null)
  const [isGroupPrimary, setIsGroupPrimary] = useState(false)

  const addMember = () => setMembers((prev) => [...prev, { firstName: "", lastName: "", guestType: "adult" }])
  const removeMember = (idx: number) => setMembers((prev) => prev.filter((_, i) => i !== idx))
  const updateMember = (idx: number, field: "firstName" | "lastName" | "guestType", value: string) =>
    setMembers((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)))

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
          rsvpStatus: guest.rsvp_status,
          groupInvite: !!guest.group_id,
        })

        setOriginalGroupId(guest.group_id)
        
        // If this guest has a group_id, fetch group members and check if this is the primary guest
        if (guest.group_id) {
          const [{ data: groupData }, { data: groupMembers }] = await Promise.all([
            supabase.from("guest_groups").select("primary_guest_id").eq("id", guest.group_id).single(),
            supabase.from("guests").select("id, first_name, last_name").eq("group_id", guest.group_id).neq("id", params.id)
          ])
          
          setIsGroupPrimary(groupData?.primary_guest_id === params.id)
          setMembers(groupMembers?.map(m => ({ id: m.id, firstName: m.first_name, lastName: m.last_name, guestType: "adult" })) || [])
        }
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
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get current wedding via RLS
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
        let groupId = originalGroupId
        
        // If switching from individual to group, create new group
        if (!originalGroupId) {
          const { data: groupRows, error: groupErr } = await supabase
            .from("guest_groups")
            .insert({ wedding_id: weddingId, name: null })
            .select("id")
            .single()
          if (groupErr) throw groupErr
          groupId = groupRows.id as string
        }

        // Update main guest with group_id
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
            rsvp_status: formData.rsvpStatus,
            group_id: groupId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.id)

        if (updateError) throw updateError

        // Set this guest as primary if not already set
        if (!originalGroupId || !isGroupPrimary) {
          const { error: primaryErr } = await supabase
            .from("guest_groups")
            .update({ primary_guest_id: params.id })
            .eq("id", groupId)
          if (primaryErr) throw primaryErr
        }

        // Handle group members
        if (originalGroupId) {
          // Delete removed members
          const existingMemberIds = members.filter(m => m.id).map(m => m.id!)
          if (existingMemberIds.length > 0) {
            const { error: deleteErr } = await supabase
              .from("guests")
              .delete()
              .eq("group_id", groupId)
              .neq("id", params.id)
              .not("id", "in", `(${existingMemberIds.join(",")})`)
            if (deleteErr) throw deleteErr
          } else {
            // Delete all existing members if none selected
            const { error: deleteAllErr } = await supabase
              .from("guests")
              .delete()
              .eq("group_id", groupId)
              .neq("id", params.id)
            if (deleteAllErr) throw deleteAllErr
          }

          // Update existing members
          for (const member of members.filter(m => m.id)) {
            const { error: updateMemberErr } = await supabase
              .from("guests")
              .update({
                first_name: member.firstName,
                last_name: member.lastName,
                updated_at: new Date().toISOString(),
              })
              .eq("id", member.id!)
            if (updateMemberErr) throw updateMemberErr
          }
        }

        // Insert new members
        const newMembers = members.filter(m => !m.id && (m.firstName.trim() || m.lastName.trim()))
        if (newMembers.length > 0) {
          const payload = newMembers.map((m) => ({
            wedding_id: weddingId,
            first_name: m.firstName || "",
            last_name: m.lastName || "",
            guest_type: "adult",
            group_id: groupId,
          }))
          const { error: insertErr } = await supabase.from("guests").insert(payload)
          if (insertErr) throw insertErr
        }
      } else {
        // Individual guest - remove from group if was in one
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
            rsvp_status: formData.rsvpStatus,
            group_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", params.id)

        if (updateError) throw updateError

        // If this was a group primary guest, clean up the group
        if (originalGroupId && isGroupPrimary) {
          // Delete other group members
          const { error: deleteErr } = await supabase
            .from("guests")
            .delete()
            .eq("group_id", originalGroupId)
            .neq("id", params.id)
          if (deleteErr) throw deleteErr

          // Delete the group
          const { error: groupDeleteErr } = await supabase
            .from("guest_groups")
            .delete()
            .eq("id", originalGroupId)
          if (groupDeleteErr) throw groupDeleteErr
        }
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
