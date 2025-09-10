"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"

interface GuestEditDialogProps {
  guest: any | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GuestEditDialog({ guest, open, onOpenChange }: GuestEditDialogProps) {
  const [current, setCurrent] = useState<any | null>(guest)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (open) setCurrent(guest)
  }, [open, guest])

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [guestType, setGuestType] = useState("adult")
  const [rsvpStatus, setRsvpStatus] = useState("pending")
  const [groupInvite, setGroupInvite] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<{ id?: string; first_name: string; last_name: string }[]>([])
  const [originalGroupId, setOriginalGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (!current) return
    setFirstName(current.first_name || "")
    setLastName(current.last_name || "")
    setEmail(current.email || "")
    setPhone(current.phone || "")
    setGuestType(current.guest_type || "adult")
    setRsvpStatus(current.rsvp_status || "pending")
    const grpId = current.group_id || null
    setOriginalGroupId(grpId)
    setGroupInvite(!!grpId)
    if (grpId) {
      // Load group name and members
      ;(async () => {
        const { data: groupRows } = await supabase
          .from("guest_groups")
          .select("id,name,primary_guest_id")
          .eq("id", grpId)
          .limit(1)
        const g = groupRows?.[0]
        setGroupName(g?.name || "")
        const { data: memberRows } = await supabase
          .from("guests")
          .select("id,first_name,last_name")
          .eq("group_id", grpId)
        const filtered = (memberRows || []).filter((m) => m.id !== current.id)
        setMembers(filtered.map((m) => ({ id: m.id, first_name: m.first_name || "", last_name: m.last_name || "" })))
      })()
    } else {
      setGroupName("")
      setMembers([])
    }
  }, [current])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from("guests")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email || null,
          phone: phone || null,
          guest_type: guestType,
          rsvp_status: rsvpStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", current.id)
      if (error) throw error

      // Group operations
      if (groupInvite) {
        if (originalGroupId) {
          // Update group name and reset members (non-primary)
          await supabase.from("guest_groups").update({ name: groupName || null }).eq("id", originalGroupId)
          // Remove all non-primary members
          await supabase.from("guests").delete().eq("group_id", originalGroupId).neq("id", current.id)
          // Recreate members
          const toInsert = members
            .filter((m) => (m.first_name?.trim() || m.last_name?.trim()))
            .map((m) => ({
              wedding_id: current.wedding_id,
              first_name: (m.first_name || "").trim(),
              last_name: (m.last_name || "").trim(),
              guest_type: "adult",
              group_id: originalGroupId,
            }))
          if (toInsert.length > 0) {
            await supabase.from("guests").insert(toInsert)
          }
        } else {
          // Create a new group and attach members
          const { data: createdGroup, error: gErr } = await supabase
            .from("guest_groups")
            .insert({ wedding_id: current.wedding_id, name: groupName || null, primary_guest_id: current.id })
            .select("id")
            .limit(1)
          if (gErr) throw gErr
          const groupId = createdGroup?.[0]?.id as string
          // Update current guest with group id
          await supabase.from("guests").update({ group_id: groupId }).eq("id", current.id)
          // Insert members
          const toInsert = members
            .filter((m) => (m.first_name?.trim() || m.last_name?.trim()))
            .map((m) => ({
              wedding_id: current.wedding_id,
              first_name: (m.first_name || "").trim(),
              last_name: (m.last_name || "").trim(),
              guest_type: "adult",
              group_id: groupId,
            }))
          if (toInsert.length > 0) {
            await supabase.from("guests").insert(toInsert)
          }
        }
      } else if (!groupInvite && originalGroupId) {
        // Remove this guest from group and clean up group
        // Delete all other members and the group row, then unset group_id on current
        await supabase.from("guests").delete().eq("group_id", originalGroupId).neq("id", current.id)
        await supabase.from("guest_groups").delete().eq("id", originalGroupId)
        await supabase.from("guests").update({ group_id: null }).eq("id", current.id)
      }

      onOpenChange(false)
      router.refresh()
    } catch (err) {
      console.error("Update guest error", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Përditëso Mysafirin</DialogTitle>
        </DialogHeader>
        {current && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Emri *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Mbiemri *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefoni</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lloji</Label>
                <Select value={guestType} onValueChange={setGuestType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">I rritur</SelectItem>
                    <SelectItem value="child">Fëmijë</SelectItem>
                    <SelectItem value="infant">Foshnje</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>RSVP</Label>
                <Select value={rsvpStatus} onValueChange={setRsvpStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Në pritje</SelectItem>
                    <SelectItem value="attending">Po vjen</SelectItem>
                    <SelectItem value="not_attending">Nuk vjen</SelectItem>
                    <SelectItem value="maybe">Ndoshta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Group Invitation */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch id="groupInvite" checked={groupInvite} onCheckedChange={setGroupInvite} />
                <Label htmlFor="groupInvite">Ftesë në Grup</Label>
              </div>
              {groupInvite && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Emri i Grupit (opsionale)</Label>
                    <Input id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Familja Hoxha" />
                  </div>
                  <div className="space-y-2">
                    <Label>Anëtarë të Grupit</Label>
                    <div className="space-y-2">
                      {members.map((m, idx) => (
                        <div key={m.id || idx} className="grid grid-cols-2 gap-2">
                          <Input placeholder="Emri" value={m.first_name} onChange={(e) => setMembers(prev => prev.map((x,i) => i===idx ? { ...x, first_name: e.target.value } : x))} />
                          <div className="flex gap-2">
                            <Input placeholder="Mbiemri" value={m.last_name} onChange={(e) => setMembers(prev => prev.map((x,i) => i===idx ? { ...x, last_name: e.target.value } : x))} />
                            <Button type="button" variant="ghost" onClick={() => setMembers(prev => prev.filter((_,i) => i!==idx))}>-</Button>
                          </div>
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={() => setMembers(prev => [...prev, { first_name: "", last_name: "" }])}>+ Shto Anëtar</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anulo</Button>
              <Button type="submit" disabled={loading}>{loading ? "Duke ruajtur..." : "Ruaj"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
