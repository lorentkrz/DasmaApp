"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { StandardTable } from "@/components/ui/standard-table"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { buildInvitationUrl } from "@/lib/utils"
import { 
  Mail, 
  Send, 
  Copy, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Users,
  Search,
  Filter,
  Plus,
  Calendar,
  Eye,
  MessageSquare,
  Link as LinkIcon,
  Heart,
  Sparkles,
  Phone,
  QrCode,
  ExternalLink,
  UserCheck,
  UserX,
  UserMinus
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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

export function InvitationsDashboardRefactored({ 
  weddingId, 
  invitations, 
  guests, 
  groups 
}: InvitationsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRsvp, setSelectedRsvp] = useState("all")
  const [selectedView, setSelectedView] = useState("cards")
  
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
    responded: invitations.filter(inv => inv.responded_at).length,
    attending: guests.filter(g => g.rsvp_status === 'attending').length,
    notAttending: guests.filter(g => g.rsvp_status === 'not_attending').length,
    maybe: guests.filter(g => g.rsvp_status === 'maybe').length,
    pending: guests.filter(g => g.rsvp_status === 'pending').length
  }

  const markAsSent = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from("invitations")
        .update({ sent_at: new Date().toISOString() })
        .eq("id", invitationId)
      
      if (error) throw error
      
      toast({
        title: "Ftesa u shënua si e dërguar!",
        description: "Statusi i ftesës u përditësua me sukses."
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error marking invitation as sent:", error)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të përditësohej statusi i ftesës.",
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
    return <Badge className="bg-gray-100 text-gray-800">Pa dërguar</Badge>
  }

  const getRsvpBadge = (status: string) => {
    const configs = {
      attending: { label: "Po vjen", className: "bg-green-100 text-green-800", icon: <UserCheck className="h-3 w-3" /> },
      not_attending: { label: "Nuk vjen", className: "bg-red-100 text-red-800", icon: <UserX className="h-3 w-3" /> },
      maybe: { label: "Ndoshta", className: "bg-yellow-100 text-yellow-800", icon: <UserMinus className="h-3 w-3" /> },
      pending: { label: "Në pritje", className: "bg-gray-100 text-gray-800", icon: <Clock className="h-3 w-3" /> }
    }
    
    const config = configs[status] || { label: "Në pritje", className: "bg-gray-100 text-gray-800", icon: null }
    
    return (
      <Badge className={`${config.className} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    )
  }

  // Table columns
  const columns = [
    { key: "guest", label: "Mysafiri", sortable: true },
    { key: "status", label: "Statusi", sortable: true },
    { key: "rsvp", label: "RSVP", sortable: true },
    { key: "sent_at", label: "Dërguar", sortable: true },
    { key: "responded_at", label: "Përgjigjur", sortable: true },
    { key: "actions", label: "Veprimet", sortable: false }
  ]

  const tableData = filteredInvitations.map(inv => ({
    ...inv,
    guest: inv.guest ? 
      `${inv.guest.first_name} ${inv.guest.last_name}` : 
      inv.group?.name || "Grup",
    status: getStatusBadge(inv),
    rsvp: inv.guest ? getRsvpBadge(inv.guest.rsvp_status) : "-",
    sent_at: inv.sent_at ? new Date(inv.sent_at).toLocaleDateString('sq-AL') : "-",
    responded_at: inv.responded_at ? new Date(inv.responded_at).toLocaleDateString('sq-AL') : "-",
    actions: (
      <div className="flex items-center gap-2">
        <CopyButton 
          text={buildInvitationUrl(inv.token)} 
          buttonSize="sm"
        />
        {inv.guest?.phone && (
          <WhatsAppSendButton 
            phone={inv.guest.phone}
            message={`Përshëndetje ${inv.guest.first_name}! 🎊\n\nJu ftojmë me dashuri në dasmën tonë!\n\nKlikoni këtu për të konfirmuar: ${buildInvitationUrl(inv.token)}`}
            buttonSize="sm"
          />
        )}
        {!inv.sent_at && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => markAsSent(inv.id)}
          >
            <Send className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }))

  return (
    <div className="space-y-6">
      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-0">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-800 italic">
                "Çdo ftesë është një urë që lidh zemrat e të dashurve"
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Dërgoni ftesa të bukura dhe ndiqni përgjigjet me lehtësi
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Ftesa Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.sent / stats.total * 100) : 0}%` }}
                />
              </div>
              <span className="text-xs text-gray-500">
                {stats.sent} dërguar
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Konfirmuar</p>
            <p className="text-2xl font-bold text-gray-900">{stats.attending}</p>
            <p className="text-xs text-gray-500 mt-2">Mysafirë që vijnë</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <AlertCircle className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Në Pritje</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-2">Duke pritur përgjigje</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-xl hover:shadow-2xl transition-all">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <Eye className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Me Përgjigje</p>
            <p className="text-2xl font-bold text-gray-900">{stats.responded}</p>
            <div className="flex items-center gap-2 mt-2 text-xs">
              <span className="text-green-600">{stats.attending} Po</span>
              <span className="text-gray-400">|</span>
              <span className="text-red-600">{stats.notAttending} Jo</span>
              <span className="text-gray-400">|</span>
              <span className="text-yellow-600">{stats.maybe} ?</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Filter className="h-4 w-4 text-white" />
                </div>
                Menaxho Ftesat
              </CardTitle>
              <CardDescription>Filtro dhe dërgo ftesa për mysafirët</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedView === "cards" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("cards")}
                className="rounded-r-none"
              >
                Kartela
              </Button>
              <Button
                variant={selectedView === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedView("list")}
                className="rounded-l-none"
              >
                Listë
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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

      {/* Invitations Display */}
      {filteredInvitations.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Nuk u gjetën ftesa
            </p>
            <p className="text-gray-500 text-sm">
              {searchTerm || selectedStatus !== "all" || selectedRsvp !== "all" 
                ? "Provoni të ndryshoni filtrat" 
                : "Krijoni ftesa për mysafirët tuaj"}
            </p>
          </CardContent>
        </Card>
      ) : selectedView === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInvitations.map((inv) => {
            const guestName = inv.guest ? 
              `${inv.guest.first_name} ${inv.guest.last_name}` : 
              inv.group?.name || "Grup"
            const invUrl = buildInvitationUrl(inv.token)
            
            return (
              <Card key={inv.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {guestName}
                      </CardTitle>
                      {inv.guest?.phone && (
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {inv.guest.phone}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(inv)}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {/* RSVP Status */}
                  {inv.guest && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Përgjigja:</span>
                      {getRsvpBadge(inv.guest.rsvp_status)}
                    </div>
                  )}
                  
                  {/* Timeline */}
                  <div className="space-y-2 text-xs text-gray-600">
                    {inv.sent_at && (
                      <div className="flex items-center gap-2">
                        <Send className="h-3 w-3" />
                        <span>Dërguar: {new Date(inv.sent_at).toLocaleDateString('sq-AL')}</span>
                      </div>
                    )}
                    {inv.opened_at && (
                      <div className="flex items-center gap-2">
                        <Eye className="h-3 w-3" />
                        <span>Hapur: {new Date(inv.opened_at).toLocaleDateString('sq-AL')}</span>
                      </div>
                    )}
                    {inv.responded_at && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3 w-3" />
                        <span>Përgjigjur: {new Date(inv.responded_at).toLocaleDateString('sq-AL')}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Invitation Link */}
                  <div className="p-3 bg-blue-50 rounded-lg space-y-2">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <LinkIcon className="h-4 w-4" />
                      <span className="font-medium">Lidhja e ftesës</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={invUrl} 
                        readOnly 
                        className="text-xs bg-white"
                      />
                      <CopyButton text={invUrl} />
                      <Button size="sm" variant="outline" asChild>
                        <a href={invUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    {inv.guest?.phone && (
                      <WhatsAppSendButton 
                        phone={inv.guest.phone}
                        message={`Përshëndetje ${inv.guest.first_name}! 🎊\n\nJu ftojmë me dashuri në dasmën tonë!\n\nKlikoni këtu për të konfirmuar: ${invUrl}`}
                        buttonText="WhatsApp"
                        buttonVariant="outline"
                        buttonSize="sm"
                        className="flex-1"
                      />
                    )}
                    {!inv.sent_at && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => markAsSent(inv.id)}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Shëno si dërguar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-0">
            <StandardTable
              columns={columns}
              data={tableData}
              pageSize={10}
            />
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      {filteredInvitations.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700 text-sm">
                Duke shfaqur <span className="font-medium">{filteredInvitations.length}</span> nga{" "}
                <span className="font-medium">{invitations.length}</span> ftesa
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
