"use client"

import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
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
  plus_one_name: string | null
  rsvp_status: string
  rsvp_responded_at: string | null
  dietary_restrictions: string | null
  invitations?: Array<{
    id: string
    token?: string
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
  regular: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300",
  child: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300",
  family: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300",
  friend: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300",
  colleague: "bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border-orange-300",
  plus_one: "bg-gradient-to-r from-pink-100 to-rose-100 text-pink-800 border-pink-300",
}

const guestTypeTranslations: Record<string, string> = {
  regular: "I rritur",
  child: "Fëmijë",
  family: "Familjar",
  friend: "Mik",
  colleague: "Koleg",
  plus_one: "Shoqërues"
}

function GuestList({ guests }: { guests: Guest[] }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleStatusChange = async (guestId: string, newStatus: string) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('guests')
        .update({ 
          rsvp_status: newStatus,
          rsvp_responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', guestId)

      if (error) {
        console.error('Error updating RSVP status:', error)
        toast({
          title: "Gabim",
          description: "Nuk u arrit të përditësohet statusi i RSVP",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Sukses",
        description: "Statusi i RSVP u përditësua me sukses",
      })
      
      // Refresh the page to show updated data
      router.refresh()
    } catch (error) {
      console.error('Error updating RSVP status:', error)
      toast({
        title: "Gabim",
        description: "Ndodhi një gabim gjatë përditësimit",
        variant: "destructive",
      })
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = 
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm)

    const matchesStatus = selectedStatus === "all" || guest.rsvp_status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const handleDelete = async (guest: Guest) => {
    try {
      const supabase = createClient()
      setDeletingId(guest.id)
      const removed = guest
      const { error } = await supabase.from("guests").delete().eq("id", guest.id)

      if (error) throw error
      // Undo snackbar
      toast({
        title: "Mysafiri u fshi!",
        description: `${guest.first_name} ${guest.last_name} u largua.`,
      })
      // Offer an undo using sonner toast for action
      ;(require('sonner') as any).toast?.message?.("Fshirë. Anulo?", {
        action: {
          label: "Anulo",
          onClick: async () => {
            try {
              const sup = createClient()
              await sup.from('guests').insert([{ ...removed, created_at: undefined, updated_at: undefined }])
              router.refresh()
            } catch (e) {
              console.error('Undo failed', e)
            }
          }
        }
      })
      router.refresh()
    } catch (error) {
      console.error("Gabim gjatë fshirjes së mysafirit:", error)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të fshihet mysafiri. Provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
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
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2 text-sm mb-2 text-gray-700">
              <Filter className="h-4 w-4" />
              Statusi i RSVP
            </div>
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-1 shadow-sm">
              {(["all","pending","attending","not_attending","maybe"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  aria-pressed={selectedStatus === s}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                    selectedStatus === s
                      ? "bg-gradient-to-r from-rose-50 to-pink-50 border border-pink-200 text-pink-800 shadow"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  {s === 'all' ? 'Të gjithë' : statusTranslations[s]}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <button
                type="button"
                onClick={() => { setSelectedStatus('all'); setSearchTerm('') }}
                className="px-3 py-1.5 rounded-full text-sm bg-white/80 border hover:bg-white transition shadow-sm"
              >
                Reseto filtrat
              </button>
            </div>
          </div>
        </div>
        {/* Active filter chips */}
        <div className="-mb-2 mt-1 flex flex-wrap items-center gap-2">
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Kërkim: “{searchTerm}” ✕
            </button>
          )}
          {selectedStatus !== 'all' && (
            <button onClick={() => setSelectedStatus('all')} className="px-2.5 py-1 rounded-full text-xs bg-white border shadow-sm hover:bg-gray-50">
              Status: {statusTranslations[selectedStatus]} ✕
            </button>
          )}
        </div>
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
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem 
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Fshi
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Fshi Mysafirin</AlertDialogTitle>
                            <AlertDialogDescription>
                              Jeni të sigurt që doni të fshini "{guest.first_name} {guest.last_name}"? Ky veprim nuk mund të zhbëhet.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulo</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(guest)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deletingId === guest.id}
                            >
                              {deletingId === guest.id ? 'Duke fshirë...' : 'Fshi'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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


                {/* Invitation Status and Send Button */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <Badge className={guest.invitations && guest.invitations.length > 0 && guest.invitations[0].sent_at
                    ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 text-xs" 
                    : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 text-xs"
                  }>
                    {guest.invitations && guest.invitations.length > 0 && guest.invitations[0].sent_at ? "Ftesa e dërguar" : "Ftesa e padërguar"}
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
                <TableHead className="text-center">Vërejtje</TableHead>
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
                      <select
                        value={guest.rsvp_status}
                        onChange={(e) => handleStatusChange(guest.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-sm font-medium border-0 focus:ring-2 focus:ring-rose-300 ${
                          guest.rsvp_status === 'attending' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' :
                          guest.rsvp_status === 'not_attending' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800' :
                          guest.rsvp_status === 'maybe' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800' :
                          'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800'
                        }`}
                      >
                        <option value="pending">Në pritje</option>
                        <option value="attending">Do të vijë</option>
                        <option value="not_attending">Nuk do të vijë</option>
                        <option value="maybe">Ndoshta</option>
                      </select>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="text-gray-400 text-sm">-</span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <Badge className={guest.invitations && guest.invitations.length > 0 && guest.invitations[0].sent_at
                          ? "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300" 
                          : "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300"
                        }>
                          {guest.invitations && guest.invitations.length > 0 && guest.invitations[0].sent_at ? "E dërguar" : "E padërguar"}
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem 
                                onSelect={(e) => e.preventDefault()}
                                className="text-destructive focus:text-destructive"
                              >
                                {deletingId === guest.id ? (
                                  <svg className="h-4 w-4 mr-2 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.75"/></svg>
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                {deletingId === guest.id ? 'Duke fshirë...' : 'Fshi'}
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Fshi Mysafirin</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Jeni të sigurt që doni të fshini "{guest.first_name} {guest.last_name}"? Ky veprim nuk mund të zhbëhet.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Anulo</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(guest)}
                                  className="bg-red-600 hover:bg-red-700"
                                  disabled={deletingId === guest.id}
                                >
                                  {deletingId === guest.id ? 'Duke fshirë...' : 'Fshi'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

export default GuestList
