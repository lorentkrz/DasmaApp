import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notifyRsvpChange } from '@/lib/notify'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Grab the latest wedding owned by the user (or any wedding if none owned)
    const { data: weddings } = await supabase
      .from('weddings')
      .select('id, owner_id')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!weddings || weddings.length === 0) {
      return NextResponse.json({ error: 'No wedding found' }, { status: 400 })
    }

    const weddingId = weddings[0].id as string

    await notifyRsvpChange({
      weddingId,
      status: 'attending',
      guestNames: 'Test Mysafiri',
      guestCount: 1,
    })

    const resendEnabled = Boolean(process.env.RESEND_API_KEY)
    const smtpEnabled = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
    const extras = (process.env.RSVP_NOTIFY_EXTRA_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean)
    const fromEmail = (process.env.EMAIL_FROM || process.env.SMTP_FROM || (resendEnabled ? 'onboarding@resend.dev' : 'notifications@dasma.app'))
    return NextResponse.json({ ok: true, debug: { transport: resendEnabled ? 'resend' : (smtpEnabled ? 'smtp' : 'none'), extras, fromEmail } })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 })
  }
}
