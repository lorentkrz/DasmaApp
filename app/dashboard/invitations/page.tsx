import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { buildInvitationUrl } from "@/lib/utils"
import { Send, Plus, Heart, Sparkles, Mail, Users, CheckCircle } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { InvitationTemplateForm } from "@/components/invitation-template-form"
import { InvitationAnalytics } from "@/components/invitation-analytics"
import { InvitationManagement } from "@/components/invitation-management"
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

  // Try simpler query first to avoid RLS issues
  const { data: rawInvitations, error: invitationsError } = await supabase
    .from("invitations")
    .select(`
      id, 
      token, 
      unique_token,
      sent_at, 
      opened_at,
      responded_at, 
      reminder_sent_at,
      invitation_type,
      template_id,
      guest_id,
      group_id,
      wedding_id,
      created_at
    `)
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Check for errors and handle them gracefully
  if (invitationsError) {
    console.error('Invitations query error:', invitationsError)
    // Return error page or fallback
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Invitations</CardTitle>
            <CardDescription className="text-red-600">
              {invitationsError.message || 'Failed to load invitations data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get all guests for the current wedding
  const { data: guests } = await supabase
    .from("guests")
    .select("id, first_name, last_name, phone, group_id, rsvp_status, plus_one_allowed, plus_one_name, guest_type")
    .eq("wedding_id", currentWedding.id)
    .order("first_name")

  // Get all guest groups
  const { data: groups } = await supabase
    .from("guest_groups")
    .select("id, name, primary_guest_id")
    .eq("wedding_id", currentWedding.id)

  // Get invitation templates
  const { data: templates } = await supabase
    .from("invitation_templates")
    .select("*")
    .eq("wedding_id", currentWedding.id)
    .order("created_at", { ascending: false })

  // Manually fetch guest and group data to avoid RLS join issues
  const guestIds = rawInvitations?.map(inv => inv.guest_id).filter(Boolean) || []
  const groupIds = rawInvitations?.map(inv => inv.group_id).filter(Boolean) || []

  // Fetch guests separately
  const { data: invitationGuests } = guestIds.length > 0 ? await supabase
    .from("guests")
    .select("id, first_name, last_name, phone, rsvp_status, plus_one_allowed, plus_one_name")
    .in("id", guestIds) : { data: [] }

  // Fetch groups separately  
  const { data: invitationGroups } = groupIds.length > 0 ? await supabase
    .from("guest_groups")
    .select("id, name, primary_guest_id")
    .in("id", groupIds) : { data: [] }

  // Transform the data to match our interface
  const invitations = rawInvitations?.map((inv: any) => {
    const guest = invitationGuests?.find(g => g.id === inv.guest_id)
    const group = invitationGroups?.find(g => g.id === inv.group_id)
    
    return {
      ...inv,
      token: inv.token || inv.unique_token,
      guest,
      group
    }
  })

  // Debug logging
  console.log('Debug - Raw invitations:', rawInvitations)
  console.log('Debug - Invitations error:', invitationsError)
  console.log('Debug - Transformed invitations:', invitations)
  console.log('Debug - Guests count:', guests?.length)
  console.log('Debug - Groups count:', groups?.length)
  console.log('Debug - Current wedding ID:', currentWedding.id)
  
  // Test direct query
  const { data: testInvitations, error: testError } = await supabase
    .from('invitations')
    .select('*')
    .eq('wedding_id', currentWedding.id)
  
  console.log('Debug - Direct invitations query:', testInvitations)
  console.log('Debug - Direct query error:', testError)

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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/20 to-pink-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/20 to-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/15 to-rose-200/15 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 relative z-10">
        {/* Enhanced Header - Mobile Responsive */}
        <div className="flex flex-col space-y-4 mb-6 md:mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg">
                <Mail className="h-5 w-5 md:h-6 md:w-6 text-white" />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 bg-clip-text text-transparent">
                Ftesat e Dasmës
              </h1>
              <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-amber-400 animate-bounce" />
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 md:px-6 py-2 md:py-3 shadow-lg">
              <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-500" fill="currentColor" />
              <p className="text-gray-700 font-medium text-base md:text-lg">
                Dërgoni ftesa të bukura dhe ndiqni përgjigjet e mysafirëve tuaj
              </p>
              <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-500" fill="currentColor" />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
            <form action={createMissingInvitations}>
              <Button type="submit" size="lg" className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <Plus className="h-5 w-5 mr-2" />
                Krijo Ftesa
              </Button>
            </form>
            <InvitationTemplateForm 
              weddingId={currentWedding.id} 
            />
          </div>
        </div>

        {/* Invitation Analytics */}
        <InvitationAnalytics stats={stats} />

        {/* Invitation Management */}
        <InvitationManagement
          weddingId={currentWedding.id}
          invitations={invitations || []}
          guests={guests || []}
          groups={groups || []}
        />

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
