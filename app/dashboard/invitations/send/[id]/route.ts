import { createClient } from "@/lib/supabase/server"
import { buildInvitationUrl } from "@/lib/utils"

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  // Fetch invitation with guest phone and token
  const { data: invitation, error } = await supabase
    .from("invitations")
    .select("id, unique_token, guest:guest_id(phone)")
    .eq("id", params.id)
    .single()

  if (error || !invitation) {
    return new Response(JSON.stringify({ error: "Invitation not found" }), { status: 404 })
  }

  const phone: string | null = invitation.guest?.phone ?? null
  if (!phone) {
    return new Response(JSON.stringify({ error: "Guest phone missing" }), { status: 400 })
  }

  const url = buildInvitationUrl(invitation.unique_token)

  // WhatsApp Cloud API config
  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID

  if (!token || !phoneId) {
    return new Response(JSON.stringify({ error: "WhatsApp env vars not set" }), { status: 500 })
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
          body: `You are invited! Please RSVP here: ${url}`,
        },
      }),
    })

    const payload = await res.json()
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "WhatsApp send failed", details: payload }), { status: 502 })
    }

    await supabase
      .from("invitations")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", params.id)

    return new Response(JSON.stringify({ ok: true, payload }), { status: 200 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500 })
  }
}
