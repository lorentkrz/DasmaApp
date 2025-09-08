"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { 
  Search,
  Users,
  User,
  Edit,
  Trash2,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

interface GuestListProps {
  guests: any[]
  groups: any[]
}

const rsvpOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Po vijnë", value: "attending" },
  { label: "Nuk vijnë", value: "not_attending" },
  { label: "Ndoshta", value: "maybe" },
  { label: "Në pritje", value: "pending" }
]

const typeOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Të rritur", value: "adult" },
  { label: "Fëmijë", value: "child" },
  { label: "Foshnje", value: "infant" }
]

export function GuestListEnterprise({ guests, groups }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRsvp, setSelectedRsvp] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  
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

  // Filter function
  const filterGuest = (guest: any) => {
    const guestName = `${guest.first_name} ${guest.last_name}`.toLowerCase()
    const matchesSearch = guestName.includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm)
    
    const matchesRsvp = selectedRsvp === "all" || guest.rsvp_status === selectedRsvp
    const matchesType = selectedType === "all" || guest.guest_type === selectedType
    
    return matchesSearch && matchesRsvp && matchesType
  }

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

  const getTypeBadge = (type: string) => {
    const configs: Record<string, any> = {
      adult: { label: "Të rritur", className: "bg-blue-100 text-blue-800" },
      child: { label: "Fëmijë", className: "bg-purple-100 text-purple-800" },
      infant: { label: "Foshnje", className: "bg-pink-100 text-pink-800" }
    }
    
    const config = configs[type] || { label: "Të rritur", className: "bg-blue-100 text-blue-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const GuestCard = ({ guest }: { guest: any }) => {
    const invitation = guest.invitations?.[0]
    
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg bg-white">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium">
              {guest.first_name} {guest.last_name}
              {guest.plus_one_name && <span className="text-sm text-gray-500 ml-2">+1: {guest.plus_one_name}</span>}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              {getRsvpBadge(guest.rsvp_status)}
              {getTypeBadge(guest.guest_type)}
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              {guest.email && (
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {guest.email}
                </div>
              )}
              {guest.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {guest.phone}
                </div>
              )}
            </div>
            {/* Invitation Timeline */}
            {invitation && (
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
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" asChild title="Ndrysho mysafirin">
            <a href={`/dashboard/guests/${guest.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Ndrysho</span>
            </a>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => handleDelete(guest.id, `${guest.first_name} ${guest.last_name}`)}
            className="text-red-600 hover:text-red-700"
            title="Fshi mysafirin"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Fshi</span>
          </Button>
        </div>
      </div>
    )
  }

  // Calculate stats
  const stats = {
    total: guests.length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    notAttending: guests.filter(g => g.rsvp_status === 'not_attending').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Mysafirë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Po Vijnë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attending}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.attending / stats.total) * 100)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nuk Vijnë</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.notAttending}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.notAttending / stats.total) * 100)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Në Pritje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-xs text-gray-500">{Math.round((stats.pending / stats.total) * 100)}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtro Mysafirët</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Kërko sipas emrit, email, telefon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <StandardDropdown
              value={selectedRsvp}
              onValueChange={(value) => setSelectedRsvp(Array.isArray(value) ? value[0] : value)}
              options={rsvpOptions}
              placeholder="RSVP"
              className="w-full"
            />
            <StandardDropdown
              value={selectedType}
              onValueChange={(value) => setSelectedType(Array.isArray(value) ? value[0] : value)}
              options={typeOptions}
              placeholder="Lloji"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guests List */}
      <div className="space-y-4">
        {/* Group Guests */}
        {Object.keys(grouped).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Mysafirë Gruporë
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="space-y-2">
                {Object.entries(grouped).map(([groupName, groupData]) => {
                  // Check if primary guest matches filter
                  if (!filterGuest(groupData.primary)) return null
                  
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
                            {getRsvpBadge(groupData.primary.rsvp_status)}
                            {getTypeBadge(groupData.primary.guest_type)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-2">
                          {/* Primary Guest */}
                          <div className="bg-blue-50 rounded-lg p-2">
                            <GuestCard guest={groupData.primary} />
                          </div>
                          {/* Group Members */}
                          {groupData.members.map((member) => (
                            <GuestCard key={member.id} guest={member} />
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

        {/* Individual Guests */}
        {individual.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Mysafirë Individualë
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {individual.filter(filterGuest).map((guest) => (
                  <GuestCard key={guest.id} guest={guest} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
