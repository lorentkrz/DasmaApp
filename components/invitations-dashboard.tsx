"use client"

import { useMemo, useState } from "react"
import { InvitationAnalytics } from "@/components/invitation-analytics"
import { InvitationManagement } from "@/components/invitation-management"

export type InvitationRecord = {
  id: string
  token: string
  sent_at: string | null
  opened_at: string | null
  responded_at: string | null
  reminder_sent_at: string | null
  invitation_type?: string | null
  template_id?: string | null
  guest_id?: string | null
  group_id?: string | null
  wedding_id: string
  created_at: string
  guest?: any
  group?: any
}

export interface InvitationsDashboardProps {
  weddingId: string
  invitations: InvitationRecord[]
  guests: any[]
  groups: any[]
}

type StatusFilter = "all" | "sent" | "opened" | "responded" | "pending"
type RangeFilter = "all" | "7d" | "30d"
type PhoneFilter = "all" | "yes" | "no"
type TargetFilter = "all" | "individual" | "group"
type TypeFilter = "all" | "rsvp" | "save_the_date" | "thank_you"

export function InvitationsDashboard({ weddingId, invitations, guests, groups }: InvitationsDashboardProps) {
  const [status, setStatus] = useState<StatusFilter>("all")
  const [range, setRange] = useState<RangeFilter>("all")
  const [hasPhone, setHasPhone] = useState<PhoneFilter>("all")
  const [target, setTarget] = useState<TargetFilter>("all")
  const [invType, setInvType] = useState<TypeFilter>("all")

  const filteredInvitations = useMemo(() => {
    const now = new Date()
    const after = (dateStr: string | null, days: number) => {
      if (!dateStr) return false
      const d = new Date(dateStr)
      const diff = now.getTime() - d.getTime()
      return diff <= days * 24 * 60 * 60 * 1000
    }

    return (invitations || []).filter((inv) => {
      // status filter
      const isSent = !!inv.sent_at
      const isOpened = !!inv.opened_at
      const isResponded = !!inv.responded_at
      const isPending = !isResponded

      const statusOk =
        status === "all" ||
        (status === "sent" && isSent) ||
        (status === "opened" && isOpened) ||
        (status === "responded" && isResponded) ||
        (status === "pending" && isPending)

      if (!statusOk) return false

      // target filter
      const isIndividual = !!inv.guest_id || !!inv.guest
      const isGroup = !!inv.group_id || !!inv.group
      const targetOk =
        target === "all" ||
        (target === "individual" && isIndividual) ||
        (target === "group" && isGroup)
      if (!targetOk) return false

      // has phone filter (only meaningful for individual invites)
      const phone = (inv as any).guest?.phone as string | undefined
      const phoneOk =
        hasPhone === "all" ||
        (hasPhone === "yes" && !!phone) ||
        (hasPhone === "no" && !phone)
      if (!phoneOk) return false

      // range filter based on created_at for simplicity
      if (range === "7d") return after(inv.created_at, 7)
      if (range === "30d") return after(inv.created_at, 30)
      
      // invitation type filter
      const typeOk = invType === "all" || (inv.invitation_type || "rsvp") === invType
      if (!typeOk) return false
      return true
    })
  }, [invitations, status, range, hasPhone, target, invType])

  const stats = useMemo(() => {
    const total = filteredInvitations.length
    const sent = filteredInvitations.filter((i) => i.sent_at).length
    const responded = filteredInvitations.filter((i) => i.responded_at).length
    const reminded = filteredInvitations.filter((i) => (i as any).reminder_sent_at).length

    // Guest-based aggregates come from full guests list (not filtered by invitation filters)
    const attending = guests?.filter((g) => g.rsvp_status === "attending")?.length || 0
    const notAttending = guests?.filter((g) => g.rsvp_status === "not_attending")?.length || 0
    const maybe = guests?.filter((g) => g.rsvp_status === "maybe")?.length || 0
    const pending = guests?.filter((g) => g.rsvp_status === "pending")?.length || 0

    return { total, sent, responded, attending, notAttending, maybe, pending, reminded }
  }, [filteredInvitations, guests])

  // Build a simple last-30-days series of responses based on responded_at
  const responseSeries = useMemo(() => {
    const days = 30
    const today = new Date()
    const start = new Date(today)
    start.setDate(start.getDate() - (days - 1))
    const buckets: { date: string; count: number }[] = []
    for (let i = 0; i < days; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      buckets.push({ date: d.toISOString().split('T')[0], count: 0 })
    }
    for (const inv of filteredInvitations) {
      const dstr = (inv.responded_at || '').slice(0, 10)
      const b = buckets.find((b) => b.date === dstr)
      if (b) b.count++
    }
    const max = Math.max(1, ...buckets.map((b) => b.count))
    return { buckets, max }
  }, [filteredInvitations])

  const clearStatus = () => setStatus("all")
  const clearRange = () => setRange("all")
  const clearTarget = () => setTarget("all")
  const clearHasPhone = () => setHasPhone("all")
  const clearAll = () => { setStatus("all"); setRange("all"); setTarget("all"); setHasPhone("all"); setInvType("all") }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b rounded-xl p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-1 shadow-sm">
            {(["all","sent","opened","responded","pending"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                  status === s 
                    ? "bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-200 text-pink-800 shadow"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {s === "all" && "Të gjitha"}
                {s === "sent" && "Dërguara"}
                {s === "opened" && "Hapura"}
                {s === "responded" && "Përgjigjur"}
                {s === "pending" && "Pa përgjigje"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-1 shadow-sm">
            {(["all","7d","30d"] as RangeFilter[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                aria-pressed={range === r}
                className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                  range === r 
                    ? "bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 shadow"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {r === "all" && "Gjithë kohën"}
                {r === "7d" && "7 ditë"}
                {r === "30d" && "30 ditë"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-1 shadow-sm">
            {(["all","individual","group"] as TargetFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                aria-pressed={target === t}
                className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                  target === t 
                    ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800 shadow"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {t === "all" && "Të gjithë"}
                {t === "individual" && "Individual"}
                {t === "group" && "Grup"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-1 shadow-sm">
            {(["all","yes","no"] as PhoneFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => setHasPhone(p)}
                aria-pressed={hasPhone === p}
                className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                  hasPhone === p
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 text-cyan-800 shadow"
                    : "text-gray-600 hover:bg-white hover:text-gray-900"
                }`}
              >
                {p === "all" && "Tel. (të gjithë)"}
                {p === "yes" && "Me telefon"}
                {p === "no" && "Pa telefon"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 px-3 py-1.5 rounded-full text-sm bg-white/80 border hover:bg-white transition shadow-sm"
          >
            Reseto filtrat
          </button>
        </div>
        {/* Active filter chips */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {status !== 'all' && (
            <button onClick={clearStatus} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Status: {status === 'sent' ? 'Dërguara' : status === 'opened' ? 'Hapura' : status === 'responded' ? 'Përgjigjur' : 'Pa përgjigje'} ✕
            </button>
          )}
          {range !== 'all' && (
            <button onClick={clearRange} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Koha: {range === '7d' ? '7 ditë' : '30 ditë'} ✕
            </button>
          )}
          {target !== 'all' && (
            <button onClick={clearTarget} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Target: {target === 'individual' ? 'Individual' : 'Grup'} ✕
            </button>
          )}
          {hasPhone !== 'all' && (
            <button onClick={clearHasPhone} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Tel: {hasPhone === 'yes' ? 'Me telefon' : 'Pa telefon'} ✕
            </button>
          )}
        </div>
      </div>

      {/* Analytics */}
      <InvitationAnalytics stats={stats} />

      {/* Responses over last 30 days */}
      <div className="bg-white border rounded-md p-3">
        <div className="text-sm font-medium text-gray-700 mb-2">Përgjigjet 30 ditët e fundit</div>
        <div className="h-20 flex items-end gap-1">
          {responseSeries.buckets.map((b, idx) => (
            <div key={b.date} title={`${b.date}: ${b.count}`} className="flex-1 bg-emerald-200" style={{ height: `${(b.count / responseSeries.max) * 100}%` }} />
          ))}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          {responseSeries.buckets[0]?.date} – {responseSeries.buckets[responseSeries.buckets.length - 1]?.date}
        </div>
      </div>

      {/* Management (filtered) */}
      <InvitationManagement 
        invitations={filteredInvitations.map((i) => ({
          ...i,
          sent_at: i.sent_at || undefined,
          opened_at: i.opened_at || undefined,
          responded_at: i.responded_at || undefined,
          reminder_sent_at: i.reminder_sent_at || undefined,
        })) as any}
        guests={guests} 
        groups={groups} 
        weddingId={weddingId} 
      />
    </div>
  )
}
