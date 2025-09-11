import { createClient as createSupabaseServiceClient } from "@supabase/supabase-js"
import webpush, { type PushSubscription as WebPushSubscription } from "web-push"
import nodemailer from "nodemailer"
import { Resend } from "resend"

export type RsvpStatus = "attending" | "not_attending" | "maybe"

function statusToSq(status: RsvpStatus) {
  switch (status) {
    case "attending":
      return "Po vjen"
    case "not_attending":
      return "Nuk vjen"
    default:
      return "Ndoshta"
  }
}

function getEnv(name: string): string | undefined {
  return process.env[name] as string | undefined
}

export async function notifyRsvpChange(opts: {
  weddingId: string
  status: RsvpStatus
  guestNames?: string
  guestCount?: number
}) {
  const { weddingId, status } = opts
  const guestNames = opts.guestNames || "Mysafirë"
  const guestCount = opts.guestCount || 1

  const SUPABASE_URL = getEnv("NEXT_PUBLIC_SUPABASE_URL")!
  const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY")
  if (!SERVICE_KEY) return // Can't notify without service role

  const svc = createSupabaseServiceClient(SUPABASE_URL, SERVICE_KEY)

  // Resolve recipients: wedding owner + planners
  const { data: wedding } = await svc
    .from("weddings")
    .select("owner_id")
    .eq("id", weddingId)
    .single()
  if (!wedding) return
  const ownerId: string = (wedding as any).owner_id

  const { data: collabs } = await svc
    .from("wedding_collaborators")
    .select("user_id")
    .eq("wedding_id", weddingId)
    .eq("role", "planner")

  const recipientIds = Array.from(
    new Set([ownerId, ...((collabs || []).map((c: any) => c.user_id))])
  )

  // Insert in-app notifications
  const statusText = statusToSq(status)
  const title = `RSVP: ${guestNames}${guestCount > 1 ? ` (+${guestCount - 1})` : ""} - ${statusText}`
  const message = `${guestNames}${guestCount > 1 ? ` (+${guestCount - 1})` : ""} → ${statusText}`
  // Idempotency: avoid duplicates within a 5-minute window
  const sinceIso = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: existingRows } = await svc
    .from("notifications")
    .select("user_id")
    .eq("message", message) // Match on message content only
    .gt("created_at", sinceIso)
    .in("user_id", recipientIds)
  const existingSet = new Set((existingRows || []).map((r: any) => r.user_id))
  const toInsert = recipientIds
    .filter((uid) => !existingSet.has(uid))
    .map((uid) => ({ user_id: uid, title, message }))
  if (toInsert.length > 0) {
    await svc.from("notifications").insert(toInsert)
  }

  // Fetch emails from profiles
  const { data: profiles } = await svc
    .from("profiles")
    .select("id, email")
    .in("id", recipientIds)

  const emailsFromProfiles = (profiles || [])
    .map((p: any) => p.email as string)
    .filter(Boolean)
  const extraEmails = (getEnv("RSVP_NOTIFY_EXTRA_EMAILS") || "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => e.length > 0)
  // Always include dasmaerp@gmail.com if no other emails are specified
  const defaultEmails = ['dasmaerp@gmail.com']
  const emails = extraEmails.length > 0
    ? Array.from(new Set([...extraEmails, ...defaultEmails]))
    : Array.from(new Set([...emailsFromProfiles, ...defaultEmails]))

  // Send email notifications (Resend preferred; fallback to SMTP)
  try {
    // If using Resend without a verified sender, use onboarding@resend.dev for testing
    const resendEnabled = Boolean(getEnv("RESEND_API_KEY"))
    const fromEmail = (getEnv("EMAIL_FROM") || getEnv("SMTP_FROM") || (resendEnabled ? "onboarding@resend.dev" : "notifications@dasma.app"))
    const subject = title
    const statusLabel = statusToSq(status)
    const statusColor = status === "attending" ? "#059669" : status === "not_attending" ? "#dc2626" : "#6b7280"
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial">
        <h3>RSVP i ri</h3>
        <p><strong>${guestNames}</strong> → <strong style="color:${statusColor}">${statusLabel}</strong> (${guestCount})</p>
        <p><a href="${getEnv("NEXT_PUBLIC_SITE_URL") || ""}/dashboard/seating">Hap vendosjen e ulëseve</a></p>
      </div>
    `

    if (resendEnabled) {
      const resend = new Resend(getEnv("RESEND_API_KEY")!)
      // Send to each email individually to match the working test script
      for (const email of emails) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject,
            html,
          })
        } catch (err) {
          console.error(`Failed to send email to ${email}:`, err)
        }
      }
    } else if (getEnv("SMTP_HOST") && getEnv("SMTP_USER") && getEnv("SMTP_PASS")) {
      const transporter = nodemailer.createTransport({
        host: getEnv("SMTP_HOST"),
        port: Number(getEnv("SMTP_PORT") || 587),
        secure: false,
        auth: { user: getEnv("SMTP_USER"), pass: getEnv("SMTP_PASS") },
      })
      for (const to of emails) {
        await transporter.sendMail({ from: fromEmail, to, subject, html })
      }
    }
  } catch (err) {
    console.warn("Email notify error", err)
  }

  // Browser push notifications
  try {
    const VAPID_PUBLIC = getEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY")
    const VAPID_PRIVATE = getEnv("VAPID_PRIVATE_KEY")
    if (VAPID_PUBLIC && VAPID_PRIVATE) {
      webpush.setVapidDetails(
        `mailto:${getEnv("EMAIL_FROM") || "admin@dasma.app"}`,
        VAPID_PUBLIC,
        VAPID_PRIVATE
      )

      const { data: subs } = await svc
        .from("push_subscriptions")
        .select("endpoint, p256dh, auth, user_id")
        .in("user_id", recipientIds)

      const payload = JSON.stringify({
        title,
        body: message,
        url: `${getEnv("NEXT_PUBLIC_SITE_URL") || ""}/dashboard/seating`,
      })

      for (const s of subs || []) {
        const subscription = {
          endpoint: (s as any).endpoint as string,
          keys: { p256dh: (s as any).p256dh as string, auth: (s as any).auth as string },
        } as WebPushSubscription
        try {
          await webpush.sendNotification(subscription, payload)
        } catch (err) {
          console.warn("Push send error", err)
        }
      }
    }
  } catch (err) {
    console.warn("Push notify error", err)
  }
}
