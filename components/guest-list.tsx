"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Phone, Mail, Edit, Trash2, Plus, Users, MoreHorizontal, Heart, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  guest_type: string
  plus_one_allowed?: boolean
  plus_one?: boolean
  plus_one_name: string | null
  rsvp_status: string
  rsvp_responded_at: string | null
  dietary_restrictions: string | null
  invitation_sent: boolean
  invitations?: Array<{
    id: string
    token?: string
    unique_token?: string
    sent_at?: string
    opened_at?: string
    responded_at?: string
  }>
}

interface GuestListProps {
  guests: Guest[]
  weddingId: string
}

const rsvpStatusColors = {
  pending: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300",
  attending: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300",
  not_attending: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300",
  maybe: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
}

const statusTranslations: Record<string, string> = {
  pending: "Në pritje",
  attending: "Pranon",
  not_attending: "Nuk pranon",
  maybe: "Ndoshta"
}

const guestTypeColors = {
  adult: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300",
  child: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
  infant: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-300",
}

const guestTypeTranslations: Record<string, string> = {
  adult: "I rritur",
  child: "Fëmijë",
  infant: "Foshnjë"
}

export function GuestList({ guests, weddingId }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = 
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || guest.rsvp_status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (guestId: string) => {
    if (!confirm("Jeni të sigurt që doni ta fshini këtë mysafir?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("guests").delete().eq("id", guestId)

      if (error) throw error
      toast.success("Mysafiri u fshi me sukses!")
      router.refresh()
    } catch (error) {
      console.error("Gabim gjatë fshirjes së mysafirit:", error)
      toast.error("Gabim në fshirjen e mysafirit")
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar - Mobile Responsive */}
      <div className="flex flex-col gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Kërkoni mysafirë..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-rose-300"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 bg-white/90 border-gray-200 rounded-xl shadow-sm">
              <Filter className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Filtroni sipas statusit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Të gjithë</SelectItem>
              <SelectItem value="pending">Në pritje</SelectItem>
              <SelectItem value="attending">Pranojnë</SelectItem>
              <SelectItem value="not_attending">Nuk pranojnë</SelectItem>
              <SelectItem value="maybe">Ndoshta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild className="w-full sm:w-auto bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all transform hover:scale-105">
          <Link href={`/dashboard/guests/new?wedding_id=${weddingId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Shto Mysafir
          </Link>
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden space-y-4">
        {filteredGuests.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
            <CardContent className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Asnjë mysafir</h3>
              <p className="text-gray-500">Shtoni mysafirin e parë për dasmën tuaj</p>
            </CardContent>
          </Card>
        ) : (
          filteredGuests.map((guest) => (
            <Card key={guest.id} className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base md:text-lg font-bold text-gray-800 mb-2">
                      {guest.first_name} {guest.last_name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={rsvpStatusColors[guest.rsvp_status as keyof typeof rsvpStatusColors]}>
                        {statusTranslations[guest.rsvp_status]}
                      </Badge>
                      <Badge className={guestTypeColors[guest.guest_type as keyof typeof guestTypeColors]}>
                        {guestTypeTranslations[guest.guest_type]}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/guests/${guest.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Ndrysho
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(guest.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Fshi
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {/* Contact Info */}
                <div className="space-y-2">
                  {guest.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <span className="break-all">{guest.email}</span>
                    </div>
                  )}
                  {guest.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                </div>

                {/* Plus One Info */}
                {(guest.plus_one_allowed || guest.plus_one) && (
                  <div className="pt-2 border-t border-gray-100">
                    {guest.plus_one_name ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
                        <span className="font-medium text-gray-700">+ {guest.plus_one_name}</span>
                      </div>
                    ) : (
                      <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 text-xs">
                        Shoqërues i lejuar
                      </Badge>
                    )}
                  </div>
                )}

                {/* Invitation Status and Send Button */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Badge className={guest.invitation_sent 
                    ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 text-xs" 
                    : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 text-xs"
                  }>
                    {guest.invitation_sent ? "Ftesa e dërguar" : "Ftesa e padërguar"}
                  </Badge>
                  {guest.invitations && guest.invitations.length > 0 && guest.phone && (
                    <WhatsAppSendButton
                      invitationId={guest.invitations[0].id}
                      guestName={`${guest.first_name} ${guest.last_name}`}
                      phone={guest.phone}
                      isSent={!!guest.invitations[0].sent_at}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-100/50 to-gray-100/50 border-b border-slate-200/50">
                <TableHead className="font-bold text-gray-800 py-4">Emri i Të Ftuarit</TableHead>
                <TableHead className="font-bold text-gray-800 py-4">Kontakti</TableHead>
                <TableHead className="font-bold text-gray-800 py-4">Lloji</TableHead>
                <TableHead className="font-bold text-gray-800 py-4">Statusi i RSVP</TableHead>
                <TableHead className="font-bold text-gray-800 py-4">Shoqërues</TableHead>
                <TableHead className="font-bold text-gray-800 py-4">Ftesa</TableHead>
                <TableHead className="w-12 font-bold text-gray-800 py-4">Veprime</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <Users className="h-12 w-12 text-gray-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">Asnjë mysafir i gjetur</h3>
                        <p className="text-gray-500">Provoni të ndryshoni kriteret e kërkimit ose shtoni mysafirë të rinj</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-rose-50/30 hover:to-pink-50/30 transition-all">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center shadow-md">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-800">{guest.first_name} {guest.last_name}</div>
                          {guest.dietary_restrictions && (
                            <div className="text-xs text-gray-500 mt-1">
                              Kufizime: {guest.dietary_restrictions}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-1">
                        {guest.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            <span>{guest.email}</span>
                          </div>
                        )}
                        {guest.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-3 w-3" />
                            <span>{guest.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={guestTypeColors[guest.guest_type as keyof typeof guestTypeColors]}>
                        {guestTypeTranslations[guest.guest_type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge className={rsvpStatusColors[guest.rsvp_status as keyof typeof rsvpStatusColors]}>
                        {statusTranslations[guest.rsvp_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {(guest.plus_one_allowed || guest.plus_one) ? (
                        guest.plus_one_name ? (
                          <div className="flex items-center gap-2">
                            <Heart className="h-4 w-4 text-rose-500" fill="currentColor" />
                            <span className="text-sm font-medium text-gray-700">{guest.plus_one_name}</span>
                          </div>
                        ) : (
                          <Badge className="bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300">
                            E lejuar
                          </Badge>
                        )
                      ) : (
                        <span className="text-gray-400 text-sm">Jo</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <Badge className={guest.invitation_sent 
                          ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300" 
                          : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
                        }>
                          {guest.invitation_sent ? "E dërguar" : "E padërguar"}
                        </Badge>
                        {guest.invitations && guest.invitations.length > 0 && guest.phone && (
                          <WhatsAppSendButton
                            invitationId={guest.invitations[0].id}
                            guestName={`${guest.first_name} ${guest.last_name}`}
                            phone={guest.phone}
                            isSent={!!guest.invitations[0].sent_at}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/guests/${guest.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Ndrysho
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(guest.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fshi
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
