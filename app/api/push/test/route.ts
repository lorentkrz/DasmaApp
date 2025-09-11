import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Missing VAPID keys' }, { status: 500 })
  }

  webpush.setVapidDetails(`mailto:${process.env.EMAIL_FROM || 'admin@dasma.app'}`, publicKey, privateKey)

  // Fetch only current user's subscriptions (RLS allows this via anon client)
  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No subscriptions found for user' })
  }

  const payload = JSON.stringify({
    title: 'Test njoftim',
    body: 'Ky është një njoftim prove për push',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/dashboard/seating`,
  })

  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({
        endpoint: s.endpoint,
        keys: { p256dh: s.p256dh, auth: s.auth },
      } as any, payload)
      sent++
    } catch (err) {
      // Skip failed ones
    }
  }

  return NextResponse.json({ ok: true, sent })
}
