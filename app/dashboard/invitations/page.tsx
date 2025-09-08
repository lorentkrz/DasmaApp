import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buildInvitationUrl } from "@/lib/utils"
import { Send, Plus, Mail, Users, CheckCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { InvitationsListEnterprise } from "@/components/invitations-list-enterprise"
import { DashboardLayout } from "@/components/dashboard-layout"
import { revalidatePath } from "next/cache"

export async function generateMetadata() {
  return {
    title: 'Ftesat e Dasmës - Wedding ERP',
    description: 'Dërgoni ftesa të bukura dhe ndiqni përgjigjet e mysafirëve tuaj'
  }
}

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

  // Fetch invitations with guest and group data
  const { data: invitations } = await supabase
    .from("invitations")
    .select(`
      *,
      guest:guests(*),
      group:guest_groups(*)
    `)
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Fetch all guests for the wedding with group relationships
  const { data: guests } = await supabase
    .from("guests")
    .select("*")
    .eq("wedding_id", currentWedding.id)

  // Fetch all groups for the wedding with primary guest info
  const { data: groups } = await supabase
    .from("guest_groups")
    .select("*")
    .eq("wedding_id", currentWedding.id)

  // Get invitation templates
  const { data: templates } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Calculate invitation statistics
  const stats = {
    total: invitations?.length || 0,
    sent: invitations?.filter(inv => inv.sent_at)?.length || 0,
    responded: invitations?.filter(inv => inv.responded_at)?.length || 0,
    attending: guests?.filter(g => g.rsvp_status === 'attending')?.length || 0,
    notAttending: guests?.filter(g => g.rsvp_status === 'not_attending')?.length || 0,
    maybe: guests?.filter(g => g.rsvp_status === 'maybe')?.length || 0,
    pending: guests?.filter(g => g.rsvp_status === 'pending')?.length || 0
  }

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
          // Rely on DB default to generate token
          invitationsToCreate.push({
            wedding_id: currentWedding.id,
            guest_id: guest.id,
            group_id: guest.group_id,
          })
          processedGroupIds.add(guest.group_id)
        }
      } 
      // If guest is not in a group and doesn't have an invitation
      else if (!existingGuestIds.has(guest.id)) {
        // Rely on DB default to generate token
        invitationsToCreate.push({
          wedding_id: currentWedding.id,
          guest_id: guest.id,
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
    <DashboardLayout
      title="Ftesat e Dasmës"
      description="Dërgoni ftesa të bukura dhe ndiqni përgjigjet e mysafirëve tuaj"
      icon="Mail"
      actions={
        <div className="flex gap-3">
          <form action={createMissingInvitations}>
            <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Krijo Ftesa
            </Button>
          </form>
        </div>
      }
    >
      {/* Invitations List */}
      <InvitationsListEnterprise
        weddingId={currentWedding.id}
        invitations={invitations || []}
        guests={guests || []}
        groups={groups || []}
      />
    </DashboardLayout>
  )
}
