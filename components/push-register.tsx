"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = typeof window !== "undefined" ? window.atob(base64) : Buffer.from(base64, "base64").toString("binary")
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushRegister() {
  useEffect(() => {
    const supabase = createClient()

    async function run() {
      if (typeof window === "undefined") return
      if (!("serviceWorker" in navigator)) return
      const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublic) return

      try {
        const { data: auth } = await supabase.auth.getUser()
        const user = auth?.user
        if (!user) return

        // Request permission
        const perm = await Notification.requestPermission()
        if (perm !== "granted") return

        // Register service worker
        const reg = await navigator.serviceWorker.register("/sw.js")

        // Subscribe to push
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublic),
        })

        // Extract keys
        const raw = JSON.parse(JSON.stringify(sub))
        const endpoint: string = sub.endpoint
        const p256dh: string = raw.keys?.p256dh
        const authKey: string = raw.keys?.auth

        // Save to Supabase (upsert by endpoint)
        await supabase
          .from("push_subscriptions")
          .upsert({
            user_id: user.id,
            endpoint,
            p256dh,
            auth: authKey,
          }, { onConflict: "endpoint" })
      } catch (err) {
        console.warn("Push registration failed", err)
      }
    }

    run()
  }, [])

  return null
}
