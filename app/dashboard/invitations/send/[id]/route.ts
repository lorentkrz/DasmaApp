import { createClient } from "@/lib/supabase/server"
import { buildInvitationUrl } from "@/lib/utils"
import { getWhatsAppService } from "@/lib/whatsapp"

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL
const SERVICE_KEY = process.env.WHATSAPP_SERVICE_KEY

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

  // Create personalized Albanian wedding message with minimal emojis
  const formattedDate = weddingDate ? new Date(weddingDate).toLocaleDateString('sq-AL', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'Data do të njoftohet së shpejti'

  const message = `FTESË PËR DASMË

I/E dashur ${guestName},

Me shumë gëzim ju ftojmë të jeni pjesë e ditës sonë më të veçantë!

${groomName} & ${brideName}

📅 ${formattedDate}
📍 ${venue || 'Vendi do të njoftohet së shpejti'}

Ju lutemi ta konfirmoni pjesëmarrjen tuaj këtu:
👉 ${url}

Prania juaj na nderon, dhe e bën këtë ditë edhe më të paharrueshme për ne.

Me dashuri,
${groomName} & ${brideName}`

  // Support preview mode to fetch the composed message without actually sending
  try {
    const urlObj = new URL((_req as any).url)
    const preview = urlObj.searchParams.get('preview')
    if (preview) {
      return new Response(JSON.stringify({
        success: true,
        preview: true,
        message,
        invitationUrl: url,
        guestName,
        phone
      }), { status: 200 })
    }
  } catch (e) {
    // ignore URL parse errors and proceed with normal flow
  }

  try {
    // If an external WhatsApp microservice is configured, proxy to it.
    if (SERVICE_URL) {
      console.log('🌐 Using external WhatsApp service at', SERVICE_URL)
      // 1) Check status on the microservice
      const statusResp = await fetch(`${SERVICE_URL}/status`, {
        headers: SERVICE_KEY ? { 'X-API-KEY': SERVICE_KEY } : undefined,
        cache: 'no-store'
      })
      const statusData = await statusResp.json()
      console.log('📊 External status:', statusData)
      if (!statusResp.ok || !statusData.ready) {
        return new Response(JSON.stringify({
          error: "WhatsApp not connected",
          details: "Please connect WhatsApp first in Dashboard → WhatsApp",
          debug: statusData
        }), { status: 400 })
      }

      // 2) Send via microservice
      console.log('📤 Proxying send to external service...')
      const sendResp = await fetch(`${SERVICE_URL}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SERVICE_KEY ? { 'X-API-KEY': SERVICE_KEY } : {})
        },
        body: JSON.stringify({ to: phone, message })
      })
      const sendData = await sendResp.json()
      console.log('📥 External send response:', sendData)
      if (!sendResp.ok || !sendData.success) {
        return new Response(JSON.stringify({
          error: "Failed to send WhatsApp message",
          details: sendData?.error || `HTTP ${sendResp.status}`
        }), { status: 502 })
      }
    } else {
      // Fallback: use in-process service for local dev
      console.log('🚀 Using in-process WhatsApp service...')
      const whatsappService = getWhatsAppService()
      const status = whatsappService.getStatus()
      console.log('📊 WhatsApp status before send:', JSON.stringify(status, null, 2))
      if (status.hasClient && !status.ready && !status.initializing) {
        console.log('🔍 Client exists but not ready, refreshing status...')
        await whatsappService.refreshStatus()
      }
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
      console.log('📤 Sending WhatsApp message (local)...')
      const result = await whatsappService.sendMessage(phone, message)
      console.log('📥 Send result:', result)
      if (!result.success) {
        console.error('❌ Failed to send:', result.error)
        return new Response(JSON.stringify({ 
          error: "Failed to send WhatsApp message", 
          details: result.error 
        }), { status: 502 })
      }
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
