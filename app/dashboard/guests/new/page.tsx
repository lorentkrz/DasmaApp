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
        if (primErr) {
          console.error("Primary guest creation error:", primErr)
          throw primErr
        }
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
        console.log("Inserting single guest with data:", {
          wedding_id: weddingId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          address: formData.address || null,
          guest_type: formData.guestType,
          dietary_restrictions: formData.dietaryRestrictions || null,
        })
        
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
        if (insertError) {
          console.error("Single guest creation error:", insertError)
          throw insertError
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
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Emri *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Mbiemri *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
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
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoni</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="border-slate-200 focus:border-slate-400 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Adresa</Label>
                <Textarea
                  id="address"
                  placeholder="Adresa e plotë"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  className="border-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestType">Lloji i mysafirit</Label>
                <Select value={formData.guestType} onValueChange={(value) => handleInputChange("guestType", value)}>
                  <SelectTrigger className="border-primary/20 focus:border-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">I rritur</SelectItem>
                    <SelectItem value="child">Fëmijë</SelectItem>
                    <SelectItem value="family">Familjar</SelectItem>
                    <SelectItem value="friend">Mik</SelectItem>
                    <SelectItem value="colleague">Koleg</SelectItem>
                    <SelectItem value="plus_one">Shoqërues</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dietaryRestrictions">Kufizime ushqimore</Label>
                <Textarea
                  id="dietaryRestrictions"
                  placeholder="Kufizime ushqimore ose alergji"
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
    </div>
  )
}
