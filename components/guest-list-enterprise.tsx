"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { StandardTableEnhanced } from "@/components/standard-table-enhanced"
import { KPIGrid } from "@/components/dashboard/KPIGrid"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users,
  User,
  Edit,
  Trash2,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Eye
} from "lucide-react"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"

interface GuestListProps {
  guests: any[]
  groups: any[]
  onEdit?: (guest: any) => void
}

export function GuestListEnterprise({ guests, groups, onEdit }: GuestListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Group guests by primary guest (group leader)
  const groupedGuests = () => {
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

    // Process guests, avoiding duplicates
    guests.forEach(guest => {
      // Skip if we already processed this guest
      if (processedGuests.has(guest.id)) {
        return
      }
      
      if (guest.group_id) {
        // This guest is part of a group
        const groupGuests = guestsByGroup[guest.group_id] || []
        const group = groups.find(gr => gr.id === guest.group_id)
        const primaryGuest = groupGuests.find(g => g.id === group?.primary_guest_id) || groupGuests[0]
        
        if (primaryGuest) {
          const groupKey = `${primaryGuest.first_name} ${primaryGuest.last_name}`
          
          // Only create group once
          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              primary: primaryGuest,
              members: []
            }
            
            // Add all group members (except primary)
            groupGuests.forEach(groupGuest => {
              if (groupGuest.id !== primaryGuest.id) {
                grouped[groupKey].members.push(groupGuest)
              }
            })
            
            // Mark all group members as processed
            groupGuests.forEach(g => processedGuests.add(g.id))
          }
        }
      } else {
        // Individual guest
        individual.push(guest)
        processedGuests.add(guest.id)
      }
    })

    return { grouped, individual }
  }

  const { grouped, individual } = groupedGuests()

  const handleDelete = async (guestId: string, guestName: string) => {
    if (!confirm(`Jeni të sigurt që doni të fshini ${guestName}?`)) return
    
    try {
      const { error } = await supabase
        .from("guests")
        .delete()
        .eq("id", guestId)
      
      if (error) throw error
      
      toast({
        title: "Mysafiri u fshi",
        description: `${guestName} u fshi me sukses`
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting guest:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të fshihej mysafiri",
        variant: "destructive"
      })
    }
  }

  const handleRowEdit = async (guest: any, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("guests")
        .update({ [key]: value })
        .eq("id", guest.id)
      
      if (error) throw error
      
      toast({
        title: "Mysafiri u përditësua",
        description: "Të dhënat u ruajtën me sukses"
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error updating guest:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të përditësohen të dhënat",
        variant: "destructive"
      })
    }
  }

  const getRsvpBadge = (status: string) => {
    const configs: Record<string, any> = {
      attending: { label: "Po vjen", className: "bg-green-500 text-white" },
      not_attending: { label: "Nuk vjen", className: "bg-red-500 text-white" },
      maybe: { label: "Ndoshta", className: "bg-yellow-500 text-white" },
      pending: { label: "Në pritje", className: "bg-gray-500 text-white" }
    }
    
    const config = configs[status] || { label: "Në pritje", className: "bg-gray-500 text-white" }
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    const configs: Record<string, any> = {
      adult: { label: "Të rritur", className: "bg-blue-100 text-blue-800" },
      child: { label: "Fëmijë", className: "bg-purple-100 text-purple-800" },
      infant: { label: "Foshnje", className: "bg-pink-100 text-pink-800" }
    }
    
    const config = configs[type] || { label: "Të rritur", className: "bg-blue-100 text-blue-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }


  // Calculate stats
  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    notAttending: guests.filter(g => g.rsvp_status === 'not_attending').length,
    maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  }

  const kpis = [
    { title: "Total Mysafirë", value: stats.total.toString(), delta: null },
    { title: "Po Vijnë", value: stats.attending.toString(), delta: { value: `${Math.round((stats.attending / stats.total) * 100)}%`, positive: true } },
    { title: "Nuk Vijnë", value: stats.notAttending.toString(), delta: { value: `${Math.round((stats.notAttending / stats.total) * 100)}%`, positive: false } },
    { title: "Në Pritje", value: stats.pending.toString(), delta: { value: `${Math.round((stats.pending / stats.total) * 100)}%`, positive: null } },
  ]

  const guestColumns = [
    { 
      key: "name", 
      header: "Emri", 
      accessor: (guest: any) => `${guest.first_name} ${guest.last_name}`,
      sortable: true,
      editable: false
    },
    { 
      key: "email", 
      header: "Email", 
      sortable: true,
      editable: true
    },
    { 
      key: "phone", 
      header: "Telefoni", 
      sortable: true,
      editable: true
    },
    { 
      key: "rsvp_status", 
      header: "RSVP", 
      accessor: (guest: any) => getRsvpBadge(guest.rsvp_status),
      sortable: true,
      editable: false
    },
    { 
      key: "guest_type", 
      header: "Lloji", 
      accessor: (guest: any) => getTypeBadge(guest.guest_type),
      sortable: true,
      editable: false
    },
    {
      key: "actions",
      header: "Veprime",
      accessor: (guest: any) => (
        <div className="flex items-center gap-2">
          {onEdit ? (
            <Button size="sm" variant="ghost" onClick={() => onEdit(guest)}>
              <Edit className="h-3 w-3" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/dashboard/guests/${guest.id}/edit`}>
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleDelete(guest.id, `${guest.first_name} ${guest.last_name}`)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
      editable: false
    }
  ] as const

  return (
    <div className="space-y-6">
      <KPIGrid items={kpis as any} />

      {/* Group Guests with Glass Accordions */}
      {Object.keys(grouped).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
            Mysafirë Gruporë
          </h2>
          <Accordion type="multiple" className="space-y-3">
            {Object.entries(grouped).map(([groupName, groupData]) => (
              <AccordionItem key={groupName} value={groupName} className="border-0">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-[color:var(--primary)]" />
                      <div>
                        <div className="font-medium">{groupName}</div>
                        <div className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]">
                          {groupData.members.length + 1} anëtar
                        </div>
                      </div>
                    </div>
                    {/* Group lead invitation status with times */}
                    <div className="hidden sm:flex items-center gap-3 pr-2 text-xs text-gray-600">
                      {(() => {
                        const inv = Array.isArray((groupData.primary as any).invitations) ? (groupData.primary as any).invitations[0] : undefined
                        if (!inv) return (
                          <span className="text-gray-500">Pa ftesë</span>
                        )
                        const fmt = (d: string) => new Date(d).toLocaleString('sq-AL', { dateStyle: 'short', timeStyle: 'short' })
                        return (
                          <div className="flex items-center gap-3">
                            {inv.sent_at && (
                              <span className="flex items-center gap-1"><Send className="h-3 w-3 text-amber-500" /> Dërguar: {fmt(inv.sent_at)}</span>
                            )}
                            {inv.opened_at && (
                              <span className="flex items-center gap-1"><Eye className="h-3 w-3 text-blue-500" /> Hapur: {fmt(inv.opened_at)}</span>
                            )}
                            {inv.responded_at && (
                              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-600" /> Përgjigjur: {fmt(inv.responded_at)}</span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <StandardTableEnhanced
                    data={[groupData.primary, ...groupData.members] as any}
                    columns={guestColumns as any}
                    onRowEdit={handleRowEdit}
                    withFilters={false}
                    emptyMessage="Nuk ka mysafirë në grup"
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}

      {/* Individual Guests Table */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
          Mysafirë Individualë
        </h2>
        <StandardTableEnhanced
          data={individual as any}
          columns={guestColumns as any}
          onRowEdit={handleRowEdit}
          emptyMessage="Nuk ka mysafirë individualë"
        />
      </div>
    </div>
  )
}
