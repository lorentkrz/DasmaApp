"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationItem {
  id: string
  title: string
  message: string
  seen: boolean
  created_at: string
}

export function NotificationsBell() {
  const supabase = useMemo(() => createClient(), [])
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const unseenCount = items.filter((n) => !n.seen).length

  async function fetchNotifications() {
    try {
      setLoading(true)
      const { data } = await supabase
        .from("notifications")
        .select("id, title, message, seen, created_at")
        .order("created_at", { ascending: false })
        .limit(12)
      const rows = data || []
      // Deduplicate by (title+message), keep most recent (list is already DESC)
      const seenKeys = new Set<string>()
      const filtered: NotificationItem[] = []
      for (const n of rows) {
        const key = `${n.title}|${n.message}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          filtered.push(n)
        }
      }
      setItems(filtered)
    } finally {
      setLoading(false)
    }
  }

  async function markAllSeen() {
    await supabase
      .from("notifications")
      .update({ seen: true })
      .eq("seen", false)
    // Optimistically mark local items as seen
    setItems((prev) => prev.map((it) => ({ ...it, seen: true })))
  }

  async function handleOpen(n: NotificationItem) {
    try {
      // Mark this notification as seen immediately for snappy UX
      setItems((prev) => prev.map((it) => it.id === n.id ? { ...it, seen: true } : it))
      await supabase
        .from("notifications")
        .update({ seen: true })
        .eq("id", n.id)
    } catch {}
    // Navigate to Seating module
    router.push("/dashboard/seating")
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 20000)
    return () => clearInterval(interval)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Njoftime">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 text-center">
                {unseenCount}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Njoftime</span>
          <Button size="sm" variant="ghost" onClick={markAllSeen} title="Shëno të gjitha si të lexuara">
            <CheckCheck className="h-4 w-4" />
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading && <div className="px-2 py-2 text-sm text-muted-foreground">Duke ngarkuar…</div>}
        {!loading && items.length === 0 && (
          <div className="px-2 py-2 text-sm text-muted-foreground">Nuk ka njoftime</div>
        )}
        {items.map((n) => {
          const parts = n.message.split("→")
          const left = (parts[0] || n.message).trim()
          const right = (parts[1] || "").trim()
          const statusClass = right === 'Po vjen' ? 'text-emerald-600' : right === 'Nuk vjen' ? 'text-red-600' : 'text-gray-500'
          return (
            <DropdownMenuItem
              key={n.id}
              className="relative w-full pr-4 flex flex-col items-start gap-0.5 cursor-pointer"
              onSelect={() => { handleOpen(n) }}
            >
              <div className="text-[13px] font-medium">{n.title}</div>
              <div className="text-xs">
                <span className="font-semibold">{left}</span>
                {right && (
                  <>
                    <span className="mx-1 text-muted-foreground">→</span>
                    <span className={statusClass}>{right}</span>
                  </>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                {new Date(n.created_at).toLocaleString("sq-AL")}
              </div>
              {!n.seen && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
