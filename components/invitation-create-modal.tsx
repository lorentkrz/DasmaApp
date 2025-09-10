"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Guest { id: string; first_name: string; last_name: string }
interface Group { id: string; name?: string; primary_guest_id: string }

interface InvitationCreateModalProps {
  weddingId: string
  guests: Guest[]
  groups: Group[]
}

export function InvitationCreateModal({ weddingId, guests, groups }: InvitationCreateModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [targetType, setTargetType] = useState<"individual" | "group">("individual")
  const [guestId, setGuestId] = useState("")
  const [groupId, setGroupId] = useState("")
  const [invitationType, setInvitationType] = useState<"rsvp" | "save_the_date" | "thank_you">("rsvp")

  const supabase = createClient()
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = { wedding_id: weddingId, invitation_type: invitationType }
      if (targetType === "group") {
        if (!groupId) return setLoading(false)
        payload.group_id = groupId
        payload.guest_id = null
      } else {
        if (!guestId) return setLoading(false)
        payload.guest_id = guestId
        payload.group_id = null
      }
      const { error } = await supabase.from("invitations").insert([payload])
      if (error) throw error
      setOpen(false)
      setGuestId(""); setGroupId("")
      router.refresh()
    } catch (err) {
      console.error("Create invitation error", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gray-900 hover:bg-gray-800 text-white">
          + Krijo Ftesë
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Krijo Ftesë</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lloji i ftesës</Label>
              <Select value={invitationType} onValueChange={(v: any) => setInvitationType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rsvp">RSVP</SelectItem>
                  <SelectItem value="save_the_date">Save the Date</SelectItem>
                  <SelectItem value="thank_you">Thank You</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destinacioni</Label>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Mysafir Individual</SelectItem>
                  <SelectItem value="group">Grup Mysafirësh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "individual" ? (
            <div className="space-y-2">
              <Label>Mysafiri</Label>
              <Select value={guestId} onValueChange={setGuestId}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni mysafirin" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {guests.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.first_name} {g.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Grupi</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Zgjidhni grupin" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {groups.map((gr) => (
                    <SelectItem key={gr.id} value={gr.id}>
                      {gr.name || `Grup ${gr.id.slice(0,8)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={loading}>{loading ? "Duke krijuar..." : "Krijo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
