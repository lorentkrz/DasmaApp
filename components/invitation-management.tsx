"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { User, Users, Calendar, CheckCircle, Trash2, Edit, Plus, Copy, MessageSquare, Eye, Bell, Mail, Sparkles, Heart, Send, FileText, Loader2, ChevronDown } from 'lucide-react'
import { CopyButton } from "@/components/copy-button"
import { WhatsAppSendButton } from "@/components/whatsapp-send-button"
import { buildInvitationUrl } from "@/lib/utils"

interface Guest {
  id: string
  first_name: string
  last_name: string
  phone?: string
  group_id?: string
  rsvp_status?: string
  plus_one_allowed?: boolean
  plus_one_name?: string
  guest_type?: string
}

interface Group {
  id: string
  name?: string
  primary_guest_id: string
}

interface Invitation {
  id: string
  token?: string
  sent_at?: string
  opened_at?: string
  responded_at?: string
  reminder_sent_at?: string
  invitation_type: string
  template_id?: string
  guest_id?: string
  group_id?: string
  guest?: Guest
  group?: Group
}

interface InvitationManagementProps {
  weddingId: string
  invitations: Invitation[]
  guests: Guest[]
  groups: Group[]
}

export function InvitationManagement({ 
  weddingId, 
  invitations, 
  guests, 
  groups
}: InvitationManagementProps) {
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(false)
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const copyShortTemplate = async (invitation: Invitation) => {
    try {
      setCopyingId(invitation.id)
      const token = invitation.token
      if (!token) {
        throw new Error('Ftesa nuk ka token të gjeneruar')
      }
      const url = buildInvitationUrl(token)
      const targetName = invitation.guest 
        ? `${invitation.guest.first_name} ${invitation.guest.last_name}`
        : invitation.group?.name || 'Mik i dashur'

      // Minimal, reusable WhatsApp template with the unique token URL
      const message = `I/E dashur ${targetName},\n\nJu ftojmë me shumë kënaqësi në dasmën tonë.\n\nJu lutemi konfirmoni pjesëmarrjen këtu:\n👉 ${url}\n\nMe respekt dhe dashuri! 💍✨`

      await navigator.clipboard.writeText(message)
      toast({ title: 'Mesazhi u kopjua', description: 'Mesazhi i plotë i WhatsApp u kopjua në kujtesë.' })
    } catch (e: any) {
      toast({ title: 'Gabim në kopjim', description: e?.message || 'Nuk u kopjua mesazhi', variant: 'destructive' })
    } finally {
      setCopyingId(null)
    }
  }

  const copyFullTemplate = async (invitation: Invitation) => {
    try {
      setCopyingId(invitation.id)
      const resp = await fetch(`/dashboard/invitations/send/${invitation.id}?preview=1`, { cache: 'no-store' })
      const data = await resp.json()
      if (!resp.ok || !data?.message) {
        throw new Error(data?.error || 'Nuk u gjenerua mesazhi i plotë')
      }
      await navigator.clipboard.writeText(data.message)
      toast({ title: 'Mesazhi u kopjua', description: 'Mesazhi i plotë i WhatsApp u kopjua në kujtesë.' })
    } catch (e: any) {
      toast({ title: 'Gabim në kopjim', description: e?.message || 'Nuk u kopjua mesazhi', variant: 'destructive' })
    } finally {
      setCopyingId(null)
    }
  }

  const sendReminder = async (invitation: Invitation) => {
    try {
      setCopyingId(invitation.id)
      const token = invitation.token
      if (!token) throw new Error('Ftesa nuk ka token')
      const url = buildInvitationUrl(token)
      const targetName = invitation.guest 
        ? `${invitation.guest.first_name} ${invitation.guest.last_name}`
        : invitation.group?.name || 'Mik i dashur'

      const reminderMsg = `Përshëndetje ${targetName},\n\nKjo është një kujtesë e vogël për ftesën tonë të dasmës.\n\nJu lutemi konfirmoni pjesëmarrjen këtu:\n👉 ${url}\n\nFaleminderit! 💍✨`

      await navigator.clipboard.writeText(reminderMsg)

      const { error } = await supabase
        .from('invitations')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', invitation.id)
      if (error) throw error

      toast({ title: 'Kujtesa u përgatit', description: 'Mesazhi u kopjua dhe u shënua si kujtesë.' })
    } catch (e: any) {
      toast({ title: 'Gabim në kujtesë', description: e?.message || 'Nuk u dërgua kujtesa', variant: 'destructive' })
    } finally {
      setCopyingId(null)
    }
  }

  const handleEdit = async (invitation: Invitation, updates: Partial<Invitation>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from("invitations")
        .update(updates)
        .eq("id", invitation.id)

      if (error) throw error

      toast({
        title: "Ftesa u përditësua!",
        description: "Ndryshimet u ruajtën me sukses.",
      })

      setEditingInvitation(null)
      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Gabim",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (invitationId: string) => {
    if (!confirm("A jeni të sigurt që doni të fshini këtë ftesë?")) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId)

      if (error) throw error

      toast({
        title: "Ftesa u fshi!",
        description: "Ftesa u fshi me sukses.",
      })

      window.location.reload()
    } catch (error: any) {
      toast({
        title: "Gabim",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getInvitationName = (invitation: Invitation) => {
    if (invitation.group_id && invitation.group?.name) {
      return `${invitation.group.name} (Grup)`
    } else if (invitation.group_id) {
      return `${invitation.guest?.first_name} ${invitation.guest?.last_name} & Shoqëria`
    } else {
      return `${invitation.guest?.first_name} ${invitation.guest?.last_name}`
    }
  }

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.responded_at) {
      return <Badge className="bg-blue-100 text-blue-700">Përgjigjur</Badge>
    } else if (invitation.sent_at) {
      return <Badge className="bg-green-100 text-green-700">Dërguar</Badge>
    } else {
      return <Badge variant="secondary">Pa dërguar</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const types = {
      rsvp: { label: "RSVP", color: "bg-rose-100 text-rose-700" },
      save_the_date: { label: "Save the Date", color: "bg-amber-100 text-amber-700" },
      thank_you: { label: "Faleminderit", color: "bg-purple-100 text-purple-700" }
    }
    const typeInfo = types[type as keyof typeof types] || types.rsvp
    return <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
      <CardHeader className="bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 rounded-t-2xl">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Mail className="h-6 w-6 text-rose-600" />
          Menaxhimi i Ftesave
          <Sparkles className="h-5 w-5 text-amber-500" />
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const target = invitation.guest || invitation.group
            const targetName = invitation.guest 
              ? `${invitation.guest.first_name} ${invitation.guest.last_name}`
              : invitation.group?.name || 'Unknown'
            const targetType = invitation.guest ? 'Individual' : 'Group'
            
            return (
              <div key={invitation.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {invitation.guest ? (
                          <User className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Users className="h-4 w-4 text-purple-500" />
                        )}
                        <span className="font-medium text-gray-900">{targetName}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {targetType}
                        </span>
                        {/* Removed +1 UI badge as per requirement */}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      {invitation.sent_at && (
                        <span className="flex items-center gap-1">
                          <Send className="h-3 w-3 text-green-500" />
                          Dërguar: {new Date(invitation.sent_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                      {invitation.opened_at && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3 text-blue-500" />
                          Hapur: {new Date(invitation.opened_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                      {invitation.responded_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Përgjigjur: {new Date(invitation.responded_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                      {invitation.reminder_sent_at && (
                        <span className="flex items-center gap-1">
                          <Bell className="h-3 w-3 text-orange-500" />
                          Kujtesë: {new Date(invitation.reminder_sent_at).toLocaleDateString('en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Copy Invitation Link */}
                    <CopyButton text={buildInvitationUrl(invitation.token || '')} />

                    {/* Copy WhatsApp Message - Dropdown (Short / Full) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={copyingId === invitation.id}
                          aria-busy={copyingId === invitation.id}
                          className="hover:bg-green-50 border-green-200"
                        >
                          {copyingId === invitation.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Duke kopjuar...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Kopjo Mesazhin
                              <ChevronDown className="h-4 w-4 ml-2" />
                            </>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[220px]">
                        <DropdownMenuItem onClick={() => copyShortTemplate(invitation)}>
                          Mesazh i shkurtër (me link)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => copyFullTemplate(invitation)}>
                          Mesazh i plotë (me datë/vend/emra)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {/* Reminder action - stamps reminder_sent_at and copies reminder text */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => sendReminder(invitation)}
                      disabled={copyingId === invitation.id}
                      className="hover:bg-amber-50 border-amber-200"
                    >
                      {copyingId === invitation.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Duke përgatitur...
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Kujto
                        </>
                      )}
                    </Button>
                    
                    {/* WhatsApp Send Button - only if guest has phone */}
                    {invitation.guest?.phone && (
                      <WhatsAppSendButton
                        invitationId={invitation.id}
                        guestName={targetName}
                        phone={invitation.guest.phone}
                        isSent={!!invitation.sent_at}
                      />
                    )}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingInvitation(invitation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5 text-blue-500" />
                            Përditëso Ftesën
                          </DialogTitle>
                        </DialogHeader>
                        <EditInvitationForm
                          invitation={invitation}
                          guests={guests}
                          groups={groups}
                          onSave={(updates) => handleEdit(invitation, updates)}
                          loading={loading}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(invitation.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

interface EditInvitationFormProps {
  invitation: Invitation
  guests: Guest[]
  groups: Group[]
  onSave: (updates: Partial<Invitation>) => void
  loading: boolean
}

function EditInvitationForm({ invitation, guests, groups, onSave, loading }: EditInvitationFormProps) {
  const [formData, setFormData] = useState({
    invitation_type: invitation.invitation_type,
    guest_id: invitation.guest_id || "",
    group_id: invitation.group_id || "",
    target_type: invitation.group_id ? "group" : "individual"
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const updates: Partial<Invitation> = {
      invitation_type: formData.invitation_type
    }

    if (formData.target_type === "group") {
      updates.group_id = formData.group_id
      updates.guest_id = undefined
    } else {
      updates.guest_id = formData.guest_id
      updates.group_id = undefined
    }

    onSave(updates)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Lloji i Ftesës</Label>
        <Select
          value={formData.invitation_type}
          onValueChange={(value: "rsvp" | "save_the_date" | "thank_you") =>
            setFormData(prev => ({ ...prev, invitation_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rsvp">RSVP - Konfirmim Pjesëmarrjeje</SelectItem>
            <SelectItem value="save_the_date">Save the Date - Ruani Datën</SelectItem>
            <SelectItem value="thank_you">Thank You - Faleminderit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Destinacioni</Label>
        <Select
          value={formData.target_type}
          onValueChange={(value: "individual" | "group") =>
            setFormData(prev => ({ ...prev, target_type: value }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Mysafir Individual</SelectItem>
            <SelectItem value="group">Grup Mysafirësh</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.target_type === "individual" ? (
        <div className="space-y-2">
          <Label>Mysafiri</Label>
          <Select
            value={formData.guest_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, guest_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Zgjidhni mysafirin" />
            </SelectTrigger>
            <SelectContent>
              {guests.map((guest) => (
                <SelectItem key={guest.id} value={guest.id}>
                  {guest.first_name} {guest.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Grupi</Label>
          <Select
            value={formData.group_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, group_id: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Zgjidhni grupin" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name || `Grup ${group.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
          {loading ? "Duke ruajtur..." : "Ruaj Ndryshimet"}
          <Heart className="h-4 w-4 ml-2" fill="currentColor" />
        </Button>
      </div>
    </form>
  )
}
