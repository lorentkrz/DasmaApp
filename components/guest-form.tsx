"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FormField } from "@/components/ui/form-field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"

interface GuestFormProps {
  weddingId: string
  tables: any[]
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  guestType: string
  dietaryRestrictions: string
  groupInvite: boolean
}

interface Member {
  firstName: string
  lastName: string
}

export function GuestForm({ weddingId, tables }: GuestFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    guestType: "adult",
    dietaryRestrictions: "",
    groupInvite: false,
  })
  
  const [members, setMembers] = useState<Member[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const addMember = () => {
    setMembers([...members, { firstName: "", lastName: "" }])
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, field: keyof Member, value: string) => {
    const updated = [...members]
    updated[index][field] = value
    setMembers(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (formData.groupInvite) {
        // Group invitation logic
        const { data: groupData, error: groupErr } = await supabase
          .from("guest_groups")
          .insert({
            wedding_id: weddingId,
            name: `${formData.firstName} ${formData.lastName}'s Group`,
          })
          .select("id")
          .single()
        
        if (groupErr) throw groupErr
        const groupId = groupData.id

        // Insert primary guest
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
            group_id: groupId,
          })
          .select("id")
          .single()
        
        if (primErr) throw primErr
        const primaryId = primaryRows.id as string

        // Set primary_guest_id on group
        const { error: updErr } = await supabase
          .from("guest_groups")
          .update({ primary_guest_id: primaryId })
          .eq("id", groupId)
        if (updErr) throw updErr

        // Insert member guests
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-200/20 to-slate-200/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 py-8 relative z-10">
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
              <div className="w-16 h-16 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center shadow-lg">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-slate-700 to-gray-800 bg-clip-text text-transparent">Shto Mysafir të Ri</h1>
            <p className="text-gray-600 text-lg">Shtoni një mysafir në listën tuaj të dasmës</p>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-slate-100 via-gray-50 to-stone-100 py-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-gray-700 rounded-full flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-800">Informacionet e Mysafirit</CardTitle>
                  <CardDescription className="text-gray-600">Plotësoni detajet e mysafirit të ri</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="firstName"
                    label="Emri"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    hint="Emri i mysafirit"
                  />
                  <FormField
                    id="lastName"
                    label="Mbiemri"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    hint="Mbiemri i mysafirit"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    id="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    hint="Email për komunikim"
                  />
                  <FormField
                    id="phone"
                    label="Telefoni"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    hint="Numri i telefonit"
                  />
                </div>

                <FormField
                  id="address"
                  label="Adresa"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  textarea
                  hint="Adresa e plotë e mysafirit"
                />

                <div className="space-y-2">
                  <Label htmlFor="guestType">Lloji i mysafirit</Label>
                  <Select value={formData.guestType} onValueChange={(value) => handleInputChange("guestType", value)}>
                    <SelectTrigger className="border-slate-200 focus:border-slate-400 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adult">I rritur</SelectItem>
                      <SelectItem value="child">Fëmijë</SelectItem>
                      <SelectItem value="family">Familjar</SelectItem>
                      <SelectItem value="friend">Mik</SelectItem>
                      <SelectItem value="colleague">Koleg</SelectItem>
                      <SelectItem value="plus_one">Shoqërues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormField
                  id="dietaryRestrictions"
                  label="Kufizime ushqimore"
                  value={formData.dietaryRestrictions}
                  onChange={(e) => handleInputChange("dietaryRestrictions", e.target.value)}
                  textarea
                  hint="Alergji, kufizime ushqimore ose preferenca"
                />

                {/* Group Invitation */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="groupInvite"
                      checked={formData.groupInvite}
                      onCheckedChange={(checked) => handleInputChange("groupInvite", checked as boolean)}
                    />
                    <Label htmlFor="groupInvite">Ftesë grupore (shtoni më shumë persona nën këtë mysafir)</Label>
                  </div>

                  {formData.groupInvite && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Shtoni persona të tjerë në këtë grup. Ata do të numërohen si mysafirë dhe do të përfshihen në të njëjtën ftesë.</div>
                      {members.map((m, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Input
                              placeholder="Emri"
                              value={m.firstName}
                              onChange={(e) => updateMember(idx, "firstName", e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="col-span-5">
                            <Input
                              placeholder="Mbiemri"
                              value={m.lastName}
                              onChange={(e) => updateMember(idx, "lastName", e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <Button type="button" variant="outline" size="sm" onClick={() => removeMember(idx)}>
                              Hiq
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="secondary" onClick={addMember}>
                        Shto Person
                      </Button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="submit" disabled={isLoading} className="flex-1 bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 rounded-xl">
                    {isLoading ? "Duke shtuar..." : "Shto Mysafir"}
                  </Button>
                  <Button type="button" variant="outline" asChild className="rounded-xl">
                    <Link href="/dashboard/guests">Anulo</Link>
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
