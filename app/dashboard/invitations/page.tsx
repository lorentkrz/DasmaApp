import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buildInvitationUrl } from "@/lib/utils"
import { Send, Plus, Heart, Sparkles, Mail, Users, CheckCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { revalidatePath } from "next/cache"

export default async function InvitationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) redirect("/auth/login")

  // current wedding
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) redirect("/dashboard/weddings/new")
  const currentWedding = weddings[0]

  // invitations with guest and group info
  const { data: invitations } = await supabase
    .from("invitations")
    .select(`
      id, 
      unique_token, 
      sent_at, 
      responded_at, 
      guest:guest_id(first_name, last_name, phone),
      group_id,
      group:group_id(primary_guest_id, name)
    `)
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  async function createMissingInvitations() {
    "use server"
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect("/auth/login")

    // Get all guests and their group information
    const { data: guests } = await supabase
      .from("guests")
      .select("id, group_id")
      .eq("wedding_id", currentWedding.id)

    // Get all existing invitations
    const { data: existing } = await supabase
      .from("invitations")
      .select("guest_id, group_id")
      .eq("wedding_id", currentWedding.id)

    // Create sets for quick lookup
    const existingGuestIds = new Set((existing || []).map((e: any) => e.guest_id))
    const existingGroupIds = new Set((existing || []).map((e: any) => e.group_id).filter(Boolean))
    
    // Find primary guests of groups that need invitations
    const { data: primaryGuests } = await supabase
      .from("guest_groups")
      .select("primary_guest_id")
      .eq("wedding_id", currentWedding.id)
    
    const primaryGuestIds = new Set(primaryGuests?.map((g: any) => g.primary_guest_id) || [])

    // Prepare invitations to create
    const invitationsToCreate = []
    const processedGroupIds = new Set()

    // Process guests
    for (const guest of guests || []) {
      // If guest is in a group
      if (guest.group_id) {
        // Skip if we've already processed this group
        if (processedGroupIds.has(guest.group_id)) continue
        
        // If this is the primary guest of the group and group doesn't have an invitation yet
        if (primaryGuestIds.has(guest.id) && !existingGroupIds.has(guest.group_id)) {
          invitationsToCreate.push({
            wedding_id: currentWedding.id,
            guest_id: guest.id,
            group_id: guest.group_id,
            unique_token: randomBytes(32).toString("base64url"),
          })
          processedGroupIds.add(guest.group_id)
        }
      } 
      // If guest is not in a group and doesn't have an invitation
      else if (!existingGuestIds.has(guest.id)) {
        invitationsToCreate.push({
          wedding_id: currentWedding.id,
          guest_id: guest.id,
          unique_token: randomBytes(32).toString("base64url"),
        })
      }
    }

    // Create the invitations
    if (invitationsToCreate.length > 0) {
      const { error } = await supabase.from("invitations").insert(invitationsToCreate)
      if (error) {
        throw new Error(`Failed to create invitations: ${error.message}`)
      }
    }

    revalidatePath("/dashboard/invitations")
  }

  async function markSent(invitationId: string) {
    "use server"
    const supabase = await createClient()
    await supabase.from("invitations").update({ sent_at: new Date().toISOString() }).eq("id", invitationId)
    revalidatePath("/dashboard/invitations")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 bg-clip-text text-transparent">
                Ftesat e Dasmës
              </h1>
            </div>
            <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <p className="text-gray-700 font-medium text-lg">
                Krijoni dhe dërgoni lidhjet RSVP për mysafirët tuaj
              </p>
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <form action={createMissingInvitations}>
              <Button type="submit" size="lg" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />
                Krijo Ftesa për të Gjithë
              </Button>
            </form>
          </div>
        </div>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-pink-100 via-rose-50 to-amber-100 py-8">
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-pink-600" />
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Lidhjet e Ftesave</CardTitle>
                <CardDescription className="text-gray-600 text-lg mt-1">
                  Kopjoni lidhjet ose dërgoni përmes WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {(invitations || []).length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-10 w-10 text-pink-500" />
                </div>
                <p className="text-lg text-gray-600 font-medium">
                  Asnjë ftesë ende. Klikoni butonin më sipër për t'i krijuar ato.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(invitations || []).map((inv: any) => {
                  const url = buildInvitationUrl(inv.unique_token)
                  const isGroup = !!inv.group_id
                  let name = "Guest"
                  
                  if (isGroup && inv.group?.name) {
                    name = `${inv.group.name} (Grup)`
                  } else if (isGroup) {
                    // If it's a group without a name, show the primary guest's name + "& Party"
                    name = inv.guest?.first_name && inv.guest?.last_name 
                      ? `${inv.guest.first_name} ${inv.guest.last_name} & Shoqëria` 
                      : "Ftesë Grupi"
                  } else {
                    // Regular individual guest
                    name = inv.guest?.first_name && inv.guest?.last_name 
                      ? `${inv.guest.first_name} ${inv.guest.last_name}` 
                      : "Mysafir"
                  }
                  
                  const phone = inv.guest?.phone
                  return (
                    <div key={inv.id} className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {isGroup ? (
                            <Users className="h-4 w-4 text-purple-500" />
                          ) : (
                            <div className="w-4 h-4 bg-pink-400 rounded-full"></div>
                          )}
                          <div className="font-semibold text-gray-800">{name}</div>
                          <div className="flex items-center gap-2">
                            {inv.sent_at ? (
                              <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                <CheckCircle className="h-3 w-3" />
                                Dërguar
                              </div>
                            ) : (
                              <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                                Pa dërguar
                              </div>
                            )}
                            {inv.responded_at && (
                              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                Përgjigjur
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded font-mono truncate">
                          {url}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CopyButton text={url} />
                        {phone ? (
                          <WhatsAppSendButton 
                            invitationId={inv.id}
                            guestName={name}
                            phone={phone}
                            isSent={!!inv.sent_at}
                          />
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Footer */}
        {(invitations || []).length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg text-center mt-8">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-pink-500" />
              <span className="text-gray-700 font-medium">
                Gjithsej <span className="font-bold text-pink-600">{(invitations || []).length}</span> ftesa të krijuara
              </span>
              <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              💕 Çdo ftesë është e krijuar me dashuri për ditën tuaj të veçantë
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
