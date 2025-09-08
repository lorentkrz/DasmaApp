"use client"

import { useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StandardTable } from "@/components/ui/standard-table"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Search, Phone, Mail, Edit, Trash2, Send, UserPlus, Download, Upload } from "lucide-react"
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

const rsvpStatusOptions = [
  { value: "all", label: "All Status" },
  { value: "pending", label: "Pending", badge: "⏳" },
  { value: "attending", label: "Attending", badge: "✅" },
  { value: "not_attending", label: "Not Attending", badge: "❌" },
  { value: "maybe", label: "Maybe", badge: "🤔" },
]

const guestTypeOptions = [
  { value: "all", label: "All Types" },
  { value: "adult", label: "Adult" },
  { value: "child", label: "Child" },
  { value: "infant", label: "Infant" },
]

export default function GuestListRefactored({ guests: initialGuests }: { guests: Guest[] }) {
  const [guests, setGuests] = useState(initialGuests)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; guest?: Guest }>({ open: false })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleStatusChange = async (guestId: string, newStatus: string) => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('guests')
        .update({ 
          rsvp_status: newStatus,
          rsvp_responded_at: new Date().toISOString(),
        })
        .eq('id', guestId)

      if (error) throw error

      setGuests(prev => prev.map(g => 
        g.id === guestId 
          ? { ...g, rsvp_status: newStatus, rsvp_responded_at: new Date().toISOString() }
          : g
      ))
      
      toast.success("RSVP status updated successfully")
    } catch (error) {
      toast.error("Failed to update RSVP status")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteDialog.guest) return
    
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("guests").delete().eq("id", deleteDialog.guest.id)
      if (error) throw error
      
      setGuests(prev => prev.filter(g => g.id !== deleteDialog.guest?.id))
      toast.success(`${deleteDialog.guest.first_name} ${deleteDialog.guest.last_name} removed`)
      setDeleteDialog({ open: false })
    } catch (error) {
      toast.error("Failed to delete guest")
    } finally {
      setLoading(false)
    }
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = 
      guest.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.includes(searchTerm)

    const matchesStatus = selectedStatus === "all" || guest.rsvp_status === selectedStatus
    const matchesType = selectedType === "all" || guest.guest_type === selectedType

    return matchesSearch && matchesStatus && matchesType
  })

  const paginatedGuests = filteredGuests.slice((page - 1) * pageSize, page * pageSize)

  const columns = [
    {
      key: "name",
      header: "Guest Name",
      accessor: (guest: Guest) => (
        <div className="flex items-center gap-2">
          <div>
            <div className="font-medium">{guest.first_name} {guest.last_name}</div>
            {guest.plus_one_name && (
              <div className="text-xs text-gray-500">+1: {guest.plus_one_name}</div>
            )}
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      key: "contact",
      header: "Contact Info",
      accessor: (guest: Guest) => (
        <div className="space-y-1">
          {guest.email && (
            <a href={`mailto:${guest.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Mail className="h-3 w-3" />
              {guest.email}
            </a>
          )}
          {guest.phone && (
            <a href={`tel:${guest.phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <Phone className="h-3 w-3" />
              {guest.phone}
            </a>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      accessor: (guest: Guest) => (
        <Badge variant="secondary" className="text-xs">
          {guest.guest_type}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "RSVP Status",
      accessor: (guest: Guest) => (
        <select
          value={guest.rsvp_status}
          onChange={(e) => handleStatusChange(guest.id, e.target.value)}
          className="px-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value="pending">Pending</option>
          <option value="attending">Attending</option>
          <option value="not_attending">Not Attending</option>
          <option value="maybe">Maybe</option>
        </select>
      ),
    },
    {
      key: "invitation",
      header: "Invitation",
      accessor: (guest: Guest) => (
        <div className="flex items-center gap-2">
          <Badge 
            variant={guest.invitations?.[0]?.sent_at ? "default" : "secondary"}
            className="text-xs"
          >
            {guest.invitations?.[0]?.sent_at ? "Sent" : "Not Sent"}
          </Badge>
          {guest.invitations?.[0] && guest.phone && (
            <WhatsAppSendButton
              invitationId={guest.invitations[0].id}
              guestName={`${guest.first_name} ${guest.last_name}`}
              phone={guest.phone}
              isSent={!!guest.invitations[0].sent_at}
            />
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (guest: Guest) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-7 w-7 p-0"
          >
            <Link href={`/dashboard/guests/${guest.id}/edit`}>
              <Edit className="h-3 w-3" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialog({ open: true, guest })}
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search guests by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <StandardDropdown
            value={selectedStatus}
            onValueChange={(value) => setSelectedStatus(Array.isArray(value) ? value[0] : value)}
            options={rsvpStatusOptions}
            placeholder="Filter by status"
            className="w-full md:w-48"
          />
          <StandardDropdown
            value={selectedType}
            onValueChange={(value) => setSelectedType(Array.isArray(value) ? value[0] : value)}
            options={guestTypeOptions}
            placeholder="Filter by type"
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        <div className="bg-white rounded-lg border p-3 text-center">
          <div className="text-2xl font-semibold">{guests.length}</div>
          <div className="text-xs text-gray-500">Total Guests</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 text-center">
          <div className="text-2xl font-semibold text-green-700">
            {guests.filter(g => g.rsvp_status === "attending").length}
          </div>
          <div className="text-xs text-green-600">Attending</div>
        </div>
        <div className="bg-amber-50 rounded-lg border border-amber-200 p-3 text-center">
          <div className="text-2xl font-semibold text-amber-700">
            {guests.filter(g => g.rsvp_status === "pending").length}
          </div>
          <div className="text-xs text-amber-600">Pending</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 text-center">
          <div className="text-2xl font-semibold text-blue-700">
            {guests.filter(g => g.rsvp_status === "maybe").length}
          </div>
          <div className="text-xs text-blue-600">Maybe</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-3 text-center">
          <div className="text-2xl font-semibold text-red-700">
            {guests.filter(g => g.rsvp_status === "not_attending").length}
          </div>
          <div className="text-xs text-red-600">Not Attending</div>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3 text-center">
          <div className="text-2xl font-semibold text-purple-700">
            {guests.filter(g => g.plus_one_name).length}
          </div>
          <div className="text-xs text-purple-600">With +1</div>
        </div>
      </div>

      {/* Table */}
      <StandardTable
        data={paginatedGuests}
        columns={columns}
        onRowClick={(guest) => router.push(`/dashboard/guests/${guest.id}/edit`)}
        emptyMessage="No guests found. Add your first guest to get started."
        pagination={{
          page,
          pageSize,
          total: filteredGuests.length,
          onPageChange: setPage,
          onPageSizeChange: (size) => {
            setPageSize(size)
            setPage(1)
          },
        }}
        loading={loading}
        compact
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open })}
        title="Delete Guest"
        description={`Are you sure you want to delete ${deleteDialog.guest?.first_name} ${deleteDialog.guest?.last_name}? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmText="Delete"
        variant="destructive"
        loading={loading}
      />
    </div>
  )
}
