import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "crypto"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buildInvitationUrl } from "@/lib/utils"
import { Send, Plus } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
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
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">Generate and send RSVP links to your guests</p>
        </div>
        <form action={createMissingInvitations}>
          <Button type="submit">
            <Plus className="h-4 w-4 mr-2" />
            Generate invitations for all guests
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invitation Links</CardTitle>
          <CardDescription>Copy links or send via WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(invitations || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No invitations yet. Click the button above to create them.</div>
          ) : (
            <div className="space-y-3">
              {(invitations || []).map((inv: any) => {
                const url = buildInvitationUrl(inv.unique_token)
                const isGroup = !!inv.group_id
                let name = "Guest"
                
                if (isGroup && inv.group?.name) {
                  name = `${inv.group.name} (Group)`
                } else if (isGroup) {
                  // If it's a group without a name, show the primary guest's name + "& Party"
                  name = inv.guest?.first_name && inv.guest?.last_name 
                    ? `${inv.guest.first_name} ${inv.guest.last_name} & Party` 
                    : "Group Invitation"
                } else {
                  // Regular individual guest
                  name = inv.guest?.first_name && inv.guest?.last_name 
                    ? `${inv.guest.first_name} ${inv.guest.last_name}` 
                    : "Guest"
                }
                
                const phone = inv.guest?.phone
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3 border rounded-md p-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{name}</div>
                      <div className="text-xs text-muted-foreground truncate">{url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={url} />
                      {phone ? (
                        <Button asChild variant="default">
                          <Link href={`/dashboard/invitations/send/${inv.id}`}> 
                            <Send className="h-4 w-4 mr-2" /> Send
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
