"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Filter, Phone, Mail, Edit, Trash2, Plus, Users, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Guest {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  guest_type: string
  plus_one_allowed: boolean
  plus_one_name: string | null
  rsvp_status: string
  rsvp_responded_at: string | null
  dietary_restrictions: string | null
  invitation_sent: boolean
}

interface GuestListProps {
  guests: Guest[]
  weddingId: string
}

const rsvpStatusColors = {
  pending: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm",
  attending: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 shadow-sm",
  not_attending: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
  maybe: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm",
}

const statusTranslations: Record<string, string> = {
  pending: "Në pritje",
  attending: "Pranon",
  not_attending: "Nuk pranon",
  maybe: "Ndoshta"
}

const guestTypeColors = {
  adult: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
  child: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm",
  infant: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm",
}

export function GuestList({ guests, weddingId }: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const router = useRouter()
  const supabase = createClient()

  // Filter guests based on search and filters
  const filteredGuests = guests.filter((guest) => {
    const matchesSearch =
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.plus_one_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || guest.rsvp_status === statusFilter
    const matchesType = typeFilter === "all" || guest.guest_type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const handleDeleteGuest = async (guestId: string) => {
    if (!confirm("Jeni i sigurt që doni të fshini këtë të ftuar?")) return

    try {
      const { error } = await supabase.from("guests").delete().eq("id", guestId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Gabim gjatë fshirjes së të ftuarit:", error)
    }
  }

  const handleUpdateRSVP = async (guestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          rsvp_status: status,
          rsvp_responded_at: new Date().toISOString(),
        })
        .eq("id", guestId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Gabim gjatë përditësimit të RSVP:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Kërko të ftuar sipas emrit, email-it apo shoqëruesit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-slate-300 focus:ring-slate-200 shadow-lg"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-56 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <SelectValue placeholder="Filtro sipas RSVP" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Të gjitha statuset</SelectItem>
            <SelectItem value="pending">Në pritje</SelectItem>
            <SelectItem value="attending">Pranon</SelectItem>
            <SelectItem value="not_attending">Nuk pranon</SelectItem>
            <SelectItem value="maybe">Ndoshta</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-56 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg">
            <SelectValue placeholder="Filtro sipas llojit" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Të gjitha llojet</SelectItem>
            <SelectItem value="adult">I rritur</SelectItem>
            <SelectItem value="child">Fëmijë</SelectItem>
            <SelectItem value="infant">Foshnjë</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enhanced Guest Table */}
      <div className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden">
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
                    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 relative overflow-hidden">
                      <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-slate-200/20 to-gray-200/20 rounded-full blur-3xl"></div>
                      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-stone-200/20 to-slate-200/20 rounded-full blur-3xl"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-gray-200/15 to-stone-200/15 rounded-full blur-3xl"></div>
                      <Users className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium text-gray-700">
                        {guests.length === 0 ? "Nuk ka të ftuar të shtuar ende" : "Asnjë i ftuar nuk përputhet me kërkimin"}
                      </p>
                      <p className="text-gray-500">
                        {guests.length === 0 ? "Filloni duke shtuar të ftuarit e parë për dasmën tuaj" : "Provoni të ndryshoni kriteret e kërkimit"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests.map((guest) => (
                <TableRow key={guest.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100/50">
                  <TableCell className="py-4">
                    <div>
                      <div className="font-bold text-gray-800 text-lg">
                        {guest.first_name} {guest.last_name}
                      </div>
                      {guest.dietary_restrictions && (
                        <div className="text-sm text-gray-600 mt-1 bg-amber-50 px-2 py-1 rounded-md inline-block">
                          Kufizime ushqimore: {guest.dietary_restrictions}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="space-y-2">
                      {guest.email && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{guest.email}</span>
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{guest.phone}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className={`${guestTypeColors[guest.guest_type as keyof typeof guestTypeColors]} font-medium`}
                    >
                      {guest.guest_type === 'adult' ? 'I rritur' : guest.guest_type === 'child' ? 'Fëmijë' : 'Foshnjë'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Select value={guest.rsvp_status} onValueChange={(value) => handleUpdateRSVP(guest.id, value)}>
                      <SelectTrigger className="w-36 rounded-xl border-0 shadow-sm">
                        <Badge
                          variant="outline"
                          className={`${rsvpStatusColors[guest.rsvp_status as keyof typeof rsvpStatusColors]} font-medium`}
                        >
                          {statusTranslations[guest.rsvp_status] || guest.rsvp_status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pending">Në pritje</SelectItem>
                        <SelectItem value="attending">Pranon</SelectItem>
                        <SelectItem value="not_attending">Nuk pranon</SelectItem>
                        <SelectItem value="maybe">Ndoshta</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-4">
                    {guest.plus_one_allowed ? (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                          <Plus className="h-4 w-4" />
                          Lejuar
                        </div>
                        {guest.plus_one_name && (
                          <div className="text-sm text-gray-700 font-medium">
                            {guest.plus_one_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 font-medium">Nuk lejohet</div>
                    )}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge 
                      variant={guest.invitation_sent ? "default" : "outline"}
                      className={guest.invitation_sent 
                        ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-sm" 
                        : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-300"
                      }
                    >
                      {guest.invitation_sent ? "Dërguar" : "Pa dërguar"}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-xl hover:bg-slate-50">
                          <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link href={`/dashboard/guests/${guest.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2 text-blue-500" />
                            Ndrysho
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-destructive focus:text-destructive rounded-lg"
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

      {/* Enhanced Footer Stats */}
      <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-slate-400" />
          <span className="text-gray-700 font-medium">
            Duke shfaqur <span className="font-bold text-slate-600">{filteredGuests.length}</span> nga <span className="font-bold text-gray-800">{guests.length}</span> të ftuar
          </span>
        </div>
        {filteredGuests.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-slate-400" />
            <span>Lista e mysafirëve për dasmën tuaj të veçantë</span>
          </div>
        )}
      </div>
    </div>
  )
}
