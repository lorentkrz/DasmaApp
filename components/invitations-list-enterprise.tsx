"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KPIGrid } from "@/components/dashboard/KPIGrid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CopyButton } from "@/components/copy-button"
import { buildInvitationUrl } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { 
  Search,
  Send,
  ExternalLink,
  Users,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

interface InvitationsListProps {
  weddingId: string
  invitations: any[]
  guests: any[]
  groups: any[]
  initialQuery?: string
  initialStatus?: "all" | "sent" | "not_sent"
}

const statusOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Të dërguara", value: "sent" },
  { label: "Pa dërguar", value: "not_sent" }
]

// RSVP filter removed per new requirements

export function InvitationsListEnterprise({ 
  weddingId, 
  invitations, 
  guests, 
  groups,
  initialQuery,
  initialStatus
}: InvitationsListProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || "")
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "all")
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Group invitations by primary guest (like guests page)
  const groupedInvitations = () => {
    const grouped: { [key: string]: { primary: any, members: any[] } } = {}
    const individual: any[] = []
    const processedGuests = new Set<string>()

    // First, collect all guests with their group relationships
    const guestsByGroup: { [key: string]: any[] } = {}
    
    guests.forEach(guest => {
      if (guest.group_id) {
        if (!guestsByGroup[guest.group_id]) {
          guestsByGroup[guest.group_id] = []
        }
        guestsByGroup[guest.group_id].push(guest)
      }
    })

    // Process invitations, avoiding duplicates
    invitations.forEach(inv => {
      if (inv.guest_id) {
        const guest = guests.find(g => g.id === inv.guest_id)
        
        // Skip if we already processed this guest
        if (processedGuests.has(inv.guest_id)) {
          return
        }
        
        if (guest?.group_id) {
          // This guest is part of a group
          const groupGuests = guestsByGroup[guest.group_id] || []
          const group = groups.find(gr => gr.id === guest.group_id)
          const primaryGuest = groupGuests.find(g => g.id === group?.primary_guest_id) || groupGuests[0]
          
          if (primaryGuest) {
            const groupKey = `${primaryGuest.first_name} ${primaryGuest.last_name}`
            
            // Only create group once
            if (!grouped[groupKey]) {
              const primaryInv = invitations.find(i => i.guest_id === primaryGuest.id)
              grouped[groupKey] = {
                primary: primaryInv ? { ...primaryInv, guest: primaryGuest } : { guest: primaryGuest },
                members: []
              }
              
              // Add all group members (except primary)
              groupGuests.forEach(groupGuest => {
                if (groupGuest.id !== primaryGuest.id) {
                  const memberInv = invitations.find(i => i.guest_id === groupGuest.id)
                  if (memberInv) {
                    grouped[groupKey].members.push({ ...memberInv, guest: groupGuest })
                  }
                }
              })
              
              // Mark all group members as processed
              groupGuests.forEach(g => processedGuests.add(g.id))
            }
          }
        } else {
          // Individual guest
          individual.push(inv)
          processedGuests.add(inv.guest_id)
        }
      } else if (inv.group_id) {
        // Group invitation
        const group = groups.find(g => g.id === inv.group_id)
        const groupGuests = guestsByGroup[inv.group_id] || []
        const primaryGuest = groupGuests.find(g => g.id === group?.primary_guest_id) || groupGuests[0]
        
        if (primaryGuest) {
          const groupKey = group?.name || `${primaryGuest.first_name} ${primaryGuest.last_name}`
          
          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              primary: { ...inv, guest: primaryGuest, group },
              members: groupGuests.filter(g => g.id !== primaryGuest.id).map(g => ({ guest: g }))
            }
            
            // Mark all group members as processed
            groupGuests.forEach(g => processedGuests.add(g.id))
          }
        }
      }
    })

    return { grouped, individual }
  }

  const { grouped, individual } = groupedInvitations()

  // Filter function
  const filterInvitation = (inv: any) => {
    const guestName = inv.guest ? 
      `${inv.guest.first_name} ${inv.guest.last_name}`.toLowerCase() : 
      inv.group?.name?.toLowerCase() || ""
    
    const matchesSearch = guestName.includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === "all" || 
      (selectedStatus === "sent" && inv.sent_at) ||
      (selectedStatus === "not_sent" && !inv.sent_at)
    
    return matchesSearch && matchesStatus
  }

  const markAsSent = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", invitationId)
      
      if (error) throw error
      
      toast({
        title: "Ftesa u shënua si e dërguar",
        description: "Statusi u përditësua me sukses."
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error marking invitation as sent:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të përditësohej statusi.",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (inv: any) => {
    if (inv.responded_at) {
      return <Badge className="bg-green-500 text-white">Me përgjigje</Badge>
    }
    if (inv.opened_at) {
      return <Badge className="bg-blue-500 text-white">E hapur</Badge>
    }
    if (inv.sent_at) {
      return <Badge className="bg-yellow-500 text-white">Derguar</Badge>
    }
    return <Badge className="bg-gray-500 text-white">Pa dërguar</Badge>
  }

  const getRsvpBadge = (status: string) => {
    const configs: Record<string, any> = {
      attending: { label: "Po vjen", className: "bg-green-500 text-white", icon: CheckCircle },
      not_attending: { label: "Nuk vjen", className: "bg-red-500 text-white", icon: XCircle },
      maybe: { label: "Ndoshta", className: "bg-yellow-500 text-white", icon: AlertCircle },
      pending: { label: "Në pritje", className: "bg-gray-500 text-white", icon: Clock }
    }
    
    const config = configs[status] || { label: "Në pritje", className: "bg-gray-500 text-white", icon: Clock }
    const Icon = config.icon
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const InvitationCard = ({ invitation, compact = false }: { invitation: any; compact?: boolean }) => (
    <div className={compact ?
      "glass rounded-lg p-3 border border-white/20 dark:border-white/10 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-sm)] transition-all duration-[var(--duration-fast)]" :
      "glass rounded-lg p-4 border border-white/20 dark:border-white/10 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--duration-fast)]"
    }>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className={compact ? "w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow" : "w-10 h-10 bg-white/80 rounded-full flex items-center justify-center shadow"}>
            <User className={compact ? "h-4 w-4 text-gray-600" : "h-5 w-5 text-gray-600"} />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {invitation.guest ? 
                `${invitation.guest.first_name} ${invitation.guest.last_name}` : 
                invitation.group?.name || "Grup"
              }
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(invitation)}
              {invitation.guest && getRsvpBadge(invitation.guest.rsvp_status)}
            </div>
            {/* Invitation Timeline */}
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              {invitation.sent_at && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Dërguar: {new Date(invitation.sent_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
              {invitation.opened_at && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Hapur: {new Date(invitation.opened_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
              {invitation.responded_at && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Përgjigjur: {new Date(invitation.responded_at).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" title="Kopjo linkun e ftesës">
            <CopyButton text={buildInvitationUrl(invitation.token)} />
            <span className="sr-only">Kopjo Link</span>
          </Button>
          <Button size="sm" variant="ghost" asChild title="Hap ftesën">
            <a href={buildInvitationUrl(invitation.token)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">Hap Ftesë</span>
            </a>
          </Button>
          {!invitation.sent_at && (
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => markAsSent(invitation.id)}
              title="Shëno si të dërguar"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Shëno si Dërguar</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  // Calculate stats (unique recipients: groups OR individuals)
  const guestsById = new Map(guests.map(g => [g.id, g]))
  const groupsWithInvites = new Set(invitations.filter(inv => inv.group_id).map(inv => inv.group_id))

  const uniqAll = new Set<string>()
  const uniqSent = new Set<string>()
  const uniqOpened = new Set<string>()
  const uniqResponded = new Set<string>()

  for (const inv of invitations) {
    let key: string | null = null
    if (inv.group_id) {
      key = `g:${inv.group_id}`
    } else if (inv.guest_id) {
      const guest = guestsById.get(inv.guest_id)
      // If there's a group invite for this guest's group, prefer the group and ignore per-guest duplicate
      if (guest?.group_id && groupsWithInvites.has(guest.group_id)) {
        key = null
      } else {
        key = `u:${inv.guest_id}`
      }
    }
    if (!key) continue
    uniqAll.add(key)
    if (inv.sent_at) uniqSent.add(key)
    if (inv.opened_at) uniqOpened.add(key)
    if (inv.responded_at) uniqResponded.add(key)
  }

  const stats = {
    total: uniqAll.size,
    sent: uniqSent.size,
    opened: uniqOpened.size,
    responded: uniqResponded.size,
  }

  // KPI data for grid
  const kpiData = [
    {
      title: "Total Ftesa",
      value: stats.total.toString(),
      description: "Ftesa të krijuara",
      trend: "stable" as const
    },
    {
      title: "Të Dërguara",
      value: stats.sent.toString(),
      description: `${stats.total ? Math.round((stats.sent / stats.total) * 100) : 0}% të totalit`,
      trend: "up" as const
    },
    {
      title: "Të Hapura", 
      value: stats.opened.toString(),
      description: `${stats.total ? Math.round((stats.opened / stats.total) * 100) : 0}% të totalit`,
      trend: "up" as const
    },
    {
      title: "Me Përgjigje",
      value: stats.responded.toString(), 
      description: `${stats.total ? Math.round((stats.responded / stats.total) * 100) : 0}% të totalit`,
      trend: "up" as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <KPIGrid items={kpiData} />

      {/* Quick Filters (Search + Status only) */}
      <div className="glass rounded-lg density-card border border-white/10 dark:border-white/10 shadow-none">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Kërko sipas emrit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/40 backdrop-blur-sm border-white/20"
              />
            </div>
          </div>
          {/* Desktop pills */}
          <div className="hidden md:flex items-center justify-end gap-2">
            {([
              {label: "Të gjitha", value: "all"},
              {label: "Të dërguara", value: "sent"},
              {label: "Pa dërguar", value: "not_sent"}
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedStatus(opt.value)}
                className={`px-3 h-9 rounded-full text-sm border transition-colors ${
                  selectedStatus === opt.value
                  ? "bg-[color:var(--primary)] text-white border-[color:var(--primary)]"
                  : "bg-white/40 dark:bg-slate-900/30 border-white/20 dark:border-white/10 hover:bg-white/60"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {/* Mobile dropdown fallback */}
          <div className="md:hidden">
            <StandardDropdown
              value={selectedStatus}
              onValueChange={(value) => {
                const raw = (Array.isArray(value) ? value[0] : value) as string
                const allowed = ["all", "sent", "not_sent"] as const
                const next = (allowed as readonly string[]).includes(raw) ? (raw as "all"|"sent"|"not_sent") : "all"
                setSelectedStatus(next)
              }}
              options={statusOptions}
              placeholder="Statusi"
            />
          </div>
        </div>
      </div>

      {/* Grouped Invitations */}
      {Object.keys(grouped).length > 0 && (
        <div className="glass rounded-lg border border-white/20 dark:border-white/10 shadow-[var(--shadow-sm)]">
          <div className="px-4 py-3 border-b border-white/20">
            <h3 className="font-semibold text-gray-900">Ftesa Grupore</h3>
          </div>
          <div className="density-card">
            <Accordion type="multiple" className="space-y-2">
              {Object.entries(grouped).map(([groupName, groupData]) => {
                if (!filterInvitation(groupData.primary)) return null
                return (
                  <AccordionItem key={groupName} value={groupName} className="glass border border-white/20 dark:border-white/10 rounded-lg shadow-[var(--shadow-xs)]">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">G</div>
                          <div className="text-left">
                            <h3 className="font-medium">{groupName}</h3>
                            <p className="text-sm text-gray-500">{groupData.members.length + 1} anëtar</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mr-4">
                          {getStatusBadge(groupData.primary)}
                          {groupData.primary.guest && getRsvpBadge(groupData.primary.guest.rsvp_status)}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <div className="space-y-2">
                        <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-2">
                          <InvitationCard invitation={groupData.primary} />
                        </div>
                        {groupData.members.map((memberData, index) => (
                          <InvitationCard key={memberData.guest?.id || index} invitation={memberData} />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </div>
        </div>
      )}

      {/* Individual Invitations */}
      {individual.length > 0 && (
        <div className="glass rounded-lg border border-white/20 dark:border-white/10 shadow-[var(--shadow-sm)]">
          <div className="px-4 py-3 border-b border-white/20">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Ftesa Individuale
            </h3>
          </div>
          <div className="density-card">
            <div className="space-y-2">
              {individual.filter(filterInvitation).map((invitation) => (
                <div key={invitation.id} className="bg-gray-50/80 dark:bg-white/5 backdrop-blur-sm rounded-lg p-2 border border-white/20 dark:border-white/10">
                  <InvitationCard invitation={invitation} compact />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
