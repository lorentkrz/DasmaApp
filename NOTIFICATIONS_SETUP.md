# Notifications Setup (In-App, Email, Browser Push)

This project includes in-app notifications, email alerts, and browser push notifications for RSVP updates.

## 1) Database migrations

A new migration adds tables and policies:
- `public.notifications` (id, user_id, title, message, seen, created_at)
- `public.push_subscriptions` (id, user_id, endpoint, p256dh, auth, created_at)

File: `scripts/060_create_notifications_and_push.sql`

Run migrations (PowerShell):

```powershell
# From the repo root
pwsh ./scripts/run_migrations.ps1
```

Ensure your `run_migrations.ps1` points to your Supabase project URL and Service Role key.

## 2) Environment variables

Add the following to your `.env.local` (or deployment env):

```
# Site URL used in emails and push payloads
NEXT_PUBLIC_SITE_URL=https://your-site-url

# VAPID keys for Web Push
# Generate with: npx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BD...yourPublicKey...
VAPID_PRIVATE_KEY=Hk...yourPrivateKey...

# Email (pick one provider)
# Resend (recommended for quick setup)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM="Dasma ERP <no-reply@yourdomain.com>"

# OR SMTP (e.g., Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Dasma ERP <your@gmail.com>"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Generate VAPID keys quickly:

```bash
npx web-push generate-vapid-keys
```

## 3) Install dependencies

```bash
npm install web-push nodemailer resend
```

These are used server-side in `lib/notify.ts`.

## 4) How it works

- RSVP changes from the public invite page trigger `notifyRsvpChange()`
  - Inserts in-app notifications for wedding owner + planners
  - Sends email via Resend or SMTP (if configured)
  - Sends browser push to all saved subscriptions for recipients
- The dashboard shows a bell with unseen count and latest notifications
  - Component: `components/notifications-bell.tsx`
  - You can mark all as seen from the dropdown
- On dashboard load, `components/push-register.tsx` registers `/sw.js` and saves a push subscription in `push_subscriptions` (RLS allows each user to manage their own subscriptions).

## 5) Testing

1. Open the Dashboard, allow Browser Notifications when prompted.
2. Open a guest invitation link and submit an RSVP.
3. You should see:
   - In-app bell count increase
   - Email delivered to the owner/planner
   - Browser push notification appears

If you run into issues, check:
- Env vars present and correct
- `060_create_notifications_and_push.sql` migration applied
- The Service Role key is configured so server-side code can insert notifications and fetch subscriptions.
