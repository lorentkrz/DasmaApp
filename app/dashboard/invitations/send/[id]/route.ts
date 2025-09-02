import { createClient } from "@/lib/supabase/server"
import { buildInvitationUrl } from "@/lib/utils"
import { getWhatsAppService } from "@/lib/whatsapp"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  console.log('📤 Send invitation API called for ID:', params.id)
  
  const supabase = await createClient()

  // Fetch invitation with guest info and wedding details
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select(`
      id, 
      unique_token, 
      guest:guest_id(first_name, last_name, phone),
      wedding:wedding_id(bride_name, groom_name, wedding_date, venue_name)
    `)
    .eq("id", params.id)
    .single()

  if (error || !invitation) {
    console.error('❌ Invitation not found:', error)
    return new Response(JSON.stringify({ error: "Invitation not found" }), { status: 404 })
  }

  const guest = invitation.guest as any
  const wedding = invitation.wedding as any
  
  const phone: string | null = guest?.phone ?? null
  console.log('📞 Guest phone:', phone)
  
  if (!phone) {
    console.error('❌ Guest phone missing')
    return new Response(JSON.stringify({ error: "Guest phone missing" }), { status: 400 })
  }

  const url = buildInvitationUrl(invitation.unique_token)
  const guestName = `${guest?.first_name} ${guest?.last_name}`
  const brideName = wedding?.bride_name || ""
  const groomName = wedding?.groom_name || ""
  const weddingDate = wedding?.wedding_date || ""
  const venue = wedding?.venue_name || ""

  console.log('👤 Sending to:', guestName, 'Phone:', phone)

  // Create personalized Albanian message
  const message = `🌹 Ftesë për Dasmë 💒

Të dashur ${guestName},

Ju ftojmë me kënaqësi të madhe në dasmën tonë!

👰 ${brideName} & 🤵 ${groomName}
📅 ${weddingDate ? new Date(weddingDate).toLocaleDateString('sq-AL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Data do të njoftohet'}
📍 ${venue || 'Vendi do të njoftohet'}

Ju lutemi konfirmoni pjesëmarrjen tuaj këtu:
${url}

Me dashuri dhe respekt,
${brideName} & ${groomName} 💕

---
Kjo ftesë është e personalizuar për ju. Ju lutemi mos e ndani me të tjerë.`

  try {
    console.log('🚀 Getting WhatsApp service...')
    const whatsappService = getWhatsAppService()
    const status = whatsappService.getStatus()
    
    console.log('📊 WhatsApp status before send:', status)
    
    if (!status.ready) {
      console.error('❌ WhatsApp not ready:', status)
      return new Response(JSON.stringify({ 
        error: "WhatsApp not connected", 
        details: "Please connect WhatsApp first in Dashboard → WhatsApp" 
      }), { status: 400 })
    }

    console.log('📤 Sending WhatsApp message...')
    const result = await whatsappService.sendMessage(phone, message)
    console.log('📥 Send result:', result)
    
    if (!result.success) {
      console.error('❌ Failed to send:', result.error)
      return new Response(JSON.stringify({ 
        error: "Failed to send WhatsApp message", 
        details: result.error 
      }), { status: 502 })
    }

    console.log('✅ Message sent successfully, updating database...')
    // Mark invitation as sent
    await supabase
      .from("invitations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", params.id)

    console.log('🎉 Invitation sent and marked as sent!')
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Invitation sent successfully via WhatsApp" 
    }), { status: 200 })
    
  } catch (e: any) {
    console.error('💥 Send invitation error:', e)
    return new Response(JSON.stringify({ 
      error: e?.message || "Unknown error",
      details: "Make sure WhatsApp Web is connected"
    }), { status: 500 })
  }
}
