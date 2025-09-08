"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StandardTable } from "@/components/ui/standard-table"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { buildInvitationUrl } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { 
  Mail, 
  Send, 
  Search,
  Clock,
  CheckCircle,
  UserCheck,
  Copy,
  MessageSquare,
  ExternalLink
} from "lucide-react"

interface InvitationsDashboardProps {
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

export function InvitationsDashboardEnterprise({ 
  weddingId, 
  invitations, 
  guests, 
  groups 
}: InvitationsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRsvp, setSelectedRsvp] = useState("all")
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  // Filter invitations
  const filteredInvitations = invitations.filter(inv => {
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
  })

  // Calculate stats
  const stats = {
    total: invitations.length,
    sent: invitations.filter(inv => inv.sent_at).length,
    opened: invitations.filter(inv => inv.opened_at).length,
    responded: invitations.filter(inv => inv.responded_at).length
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
      return <Badge className="bg-green-100 text-green-800">Me përgjigje</Badge>
    }
    if (inv.opened_at) {
      return <Badge className="bg-blue-100 text-blue-800">E hapur</Badge>
    }
    if (inv.sent_at) {
      return <Badge className="bg-yellow-100 text-yellow-800">E dërguar</Badge>
    }
    return <Badge variant="secondary">Pa dërguar</Badge>
  }

  const getRsvpBadge = (status: string) => {
    const configs: Record<string, any> = {
      attending: { label: "Po vjen", className: "bg-green-100 text-green-800" },
      not_attending: { label: "Nuk vjen", className: "bg-red-100 text-red-800" },
      maybe: { label: "Ndoshta", className: "bg-yellow-100 text-yellow-800" },
      pending: { label: "Në pritje", className: "bg-gray-100 text-gray-800" }
    }
    
    const config = configs[status] || { label: "Në pritje", className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  // Table columns
  const columns = [
    {
      key: "guest",
      label: "Mysafiri",
      accessor: (row: any) => row.guest ? 
        `${row.guest.first_name} ${row.guest.last_name}` : 
        row.group?.name || "Grup",
      header: "Mysafiri",
      sortable: true
    },
    {
      key: "status",
      label: "Statusi",
      accessor: (row: any) => getStatusBadge(row),
      header: "Statusi",
      sortable: true
    },
    {
      key: "rsvp",
      label: "RSVP",
      accessor: (row: any) => row.guest ? getRsvpBadge(row.guest.rsvp_status) : "-",
      header: "RSVP",
      sortable: true
    },
    {
      key: "sent_at",
      label: "Dërguar",
      accessor: (row: any) => row.sent_at ? new Date(row.sent_at).toLocaleDateString('sq-AL') : "-",
      header: "Dërguar",
      sortable: true
    },
    {
      key: "responded_at",
      label: "Përgjigjur",
      accessor: (row: any) => row.responded_at ? new Date(row.responded_at).toLocaleDateString('sq-AL') : "-",
      header: "Përgjigjur",
      sortable: true
    },
    {
      key: "actions",
      label: "Veprimet",
      accessor: (row: any) => (
        <div className="flex items-center gap-1">
          <CopyButton text={buildInvitationUrl(row.token)} />
          <Button 
            size="sm" 
            variant="ghost"
            asChild
          >
            <a href={buildInvitationUrl(row.token)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          {!row.sent_at && (
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => markAsSent(row.id)}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      header: "Veprimet",
      sortable: false
    }
  ]

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

      {/* Invitations Table */}
      <Card>
        <CardContent className="p-0">
          <StandardTable
            columns={columns}
            data={filteredInvitations}
            pageSize={15}
          />
        </CardContent>
      </Card>
    </div>
  )
}
