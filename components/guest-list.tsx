"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Edit, Trash2, Mail, Phone } from "lucide-react"
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
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  attending: "bg-green-100 text-green-800 border-green-200",
  not_attending: "bg-red-100 text-red-800 border-red-200",
  maybe: "bg-blue-100 text-blue-800 border-blue-200",
}

const guestTypeColors = {
  adult: "bg-gray-100 text-gray-800 border-gray-200",
  child: "bg-purple-100 text-purple-800 border-purple-200",
  infant: "bg-pink-100 text-pink-800 border-pink-200",
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
    if (!confirm("Are you sure you want to delete this guest?")) return

    try {
      const { error } = await supabase.from("guests").delete().eq("id", guestId)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting guest:", error)
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
      console.error("Error updating RSVP:", error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guests..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by RSVP" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All RSVP Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="attending">Attending</SelectItem>
            <SelectItem value="not_attending">Not Attending</SelectItem>
            <SelectItem value="maybe">Maybe</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Guest Types</SelectItem>
            <SelectItem value="adult">Adult</SelectItem>
            <SelectItem value="child">Child</SelectItem>
            <SelectItem value="infant">Infant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Guest Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>RSVP Status</TableHead>
              <TableHead>Plus One</TableHead>
              <TableHead>Invitation</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {guests.length === 0 ? "No guests added yet" : "No guests match your search criteria"}
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {guest.first_name} {guest.last_name}
                      </div>
                      {guest.dietary_restrictions && (
                        <div className="text-xs text-muted-foreground">Dietary: {guest.dietary_restrictions}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {guest.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" />
                          {guest.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={guestTypeColors[guest.guest_type as keyof typeof guestTypeColors]}
                    >
                      {guest.guest_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select value={guest.rsvp_status} onValueChange={(value) => handleUpdateRSVP(guest.id, value)}>
                      <SelectTrigger className="w-32">
                        <Badge
                          variant="outline"
                          className={rsvpStatusColors[guest.rsvp_status as keyof typeof rsvpStatusColors]}
                        >
                          {guest.rsvp_status.replace("_", " ")}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="attending">Attending</SelectItem>
                        <SelectItem value="not_attending">Not Attending</SelectItem>
                        <SelectItem value="maybe">Maybe</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {guest.plus_one_allowed ? (
                      <div className="text-sm">
                        <div className="text-green-600">✓ Allowed</div>
                        {guest.plus_one_name && <div className="text-muted-foreground">{guest.plus_one_name}</div>}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Not allowed</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={guest.invitation_sent ? "default" : "outline"}>
                      {guest.invitation_sent ? "Sent" : "Not sent"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/guests/${guest.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

      <div className="text-sm text-muted-foreground">
        Showing {filteredGuests.length} of {guests.length} guests
      </div>
    </div>
  )
}
