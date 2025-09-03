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
      token, 
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

  const url = buildInvitationUrl(invitation.token)
  const guestName = `${guest?.first_name} ${guest?.last_name}`
  const brideName = wedding?.bride_name || ""
  const groomName = wedding?.groom_name || ""
  const weddingDate = wedding?.wedding_date || ""
  const venue = wedding?.venue_name || ""

  console.log('👤 Sending to:', guestName, 'Phone:', phone)

  // Create beautiful personalized Albanian wedding message
  const formattedDate = weddingDate ? new Date(weddingDate).toLocaleDateString('sq-AL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Data do të njoftohet së shpejti'

  const message = `💒✨ FTESË PËR DASMË ✨💒

🌹 I/E dashur ${guestName}, 🌹

Me zemër të plotë gëzimi dhe dashuri, ju ftojmë të jeni pjesë e ditës më të bukur të jetës sonë!

👰🏻 ${brideName} ❤️ ${groomName} 🤵🏻

🗓️ Data: ${formattedDate}
🏛️ Vendi: ${venue || 'Vendi do të njoftohet së shpejti'}

Prania juaj do të na bëjë këtë ditë edhe më të veçantë dhe të paharrueshme. Së bashku do të festojmë dashurinë, familjen dhe miqësinë.

🎉 Ju lutemi konfirmoni pjesëmarrjen tuaj këtu:
👉 ${url}

Me shumë dashuri dhe mirënjohje,
${brideName} & ${groomName} 💕

🌸 Faleminderit që jeni pjesë e rrugëtimit tonë! 🌸

---
✨ Kjo ftesë është e personalizuar veçanërisht për ju ✨`

  try {
    console.log('🚀 Getting WhatsApp service...')
    const whatsappService = getWhatsAppService()
    const status = whatsappService.getStatus()
    
    console.log('📊 WhatsApp status before send:', JSON.stringify(status, null, 2))
    
    // Check if client exists and try to refresh status
    if (status.hasClient && !status.ready && !status.initializing) {
      console.log('🔍 Client exists but not ready, refreshing status...')
      await whatsappService.refreshStatus()
    }
    
    // Re-check status after potential update
    const updatedStatus = whatsappService.getStatus()
    console.log('📊 Updated WhatsApp status:', JSON.stringify(updatedStatus, null, 2))
    
    if (!updatedStatus.ready) {
      console.error('❌ WhatsApp not ready:', updatedStatus)
      return new Response(JSON.stringify({ 
        error: "WhatsApp not connected", 
        details: "Please connect WhatsApp first in Dashboard → WhatsApp",
        debug: updatedStatus
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
