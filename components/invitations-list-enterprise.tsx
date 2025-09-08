"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

const statusOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Të dërguara", value: "sent" },
  { label: "Të hapura", value: "opened" },
  { label: "Me përgjigje", value: "responded" },
  { label: "Pa dërguar", value: "not_sent" }
]

const rsvpOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Po vijnë", value: "attending" },
  { label: "Nuk vijnë", value: "not_attending" },
  { label: "Ndoshta", value: "maybe" },
  { label: "Në pritje", value: "pending" }
]

export function InvitationsListEnterprise({ 
  weddingId, 
  invitations, 
  guests, 
  groups 
}: InvitationsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRsvp, setSelectedRsvp] = useState("all")
  
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
      (selectedStatus === "opened" && inv.opened_at) ||
      (selectedStatus === "responded" && inv.responded_at) ||
      (selectedStatus === "not_sent" && !inv.sent_at)
    
    const guestRsvp = inv.guest?.rsvp_status
    const matchesRsvp = selectedRsvp === "all" || guestRsvp === selectedRsvp
    
    return matchesSearch && matchesStatus && matchesRsvp
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

  const InvitationCard = ({ invitation }: { invitation: any }) => (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-gray-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium">
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
                Dërguar: {new Date(invitation.sent_at).toLocaleDateString('sq-AL')}
              </div>
            )}
            {invitation.opened_at && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Hapur: {new Date(invitation.opened_at).toLocaleDateString('sq-AL')}
              </div>
            )}
            {invitation.responded_at && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Përgjigjur: {new Date(invitation.responded_at).toLocaleDateString('sq-AL')}
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
  )

  // Calculate stats
  const stats = {
    total: invitations.length,
    sent: invitations.filter(inv => inv.sent_at).length,
    opened: invitations.filter(inv => inv.opened_at).length,
    responded: invitations.filter(inv => inv.responded_at).length
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Ftesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Të Dërguara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.sent / stats.total) * 100)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Të Hapura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.opened}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.opened / stats.total) * 100)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Me Përgjigje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.responded}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.responded / stats.total) * 100)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtro Ftesat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Kërko sipas emrit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <StandardDropdown
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(Array.isArray(value) ? value[0] : value)}
              options={statusOptions}
              placeholder="Statusi"
              className="w-full"
            />
            <StandardDropdown
              value={selectedRsvp}
              onValueChange={(value) => setSelectedRsvp(Array.isArray(value) ? value[0] : value)}
              options={rsvpOptions}
              placeholder="RSVP"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invitations List */}
      <div className="space-y-4">
        {/* Group Invitations */}
        {Object.keys(grouped).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ftesa Grupore
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(grouped).map(([groupName, groupData]) => {
                  // Check if primary guest matches filter
                  if (!filterInvitation(groupData.primary)) return null
                  
                  return (
                    <AccordionItem key={groupName} value={groupName} className="border rounded-lg">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
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
                          {/* Primary Guest */}
                          <div className="bg-blue-50 rounded-lg p-2">
                            <InvitationCard invitation={groupData.primary} />
                          </div>
                          {/* Group Members */}
                          {groupData.members.map((memberData, index) => (
                            <InvitationCard key={memberData.guest?.id || index} invitation={memberData} />
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Individual Invitations */}
        {individual.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Ftesa Individuale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {individual.filter(filterInvitation).map((invitation) => (
                  <InvitationCard key={invitation.id} invitation={invitation} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
