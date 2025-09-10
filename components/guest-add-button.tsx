"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface GuestAddButtonProps {
  weddingId: string
  onAdded?: () => void
}

export function GuestAddButton({ weddingId, onAdded }: GuestAddButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [guestType, setGuestType] = useState("adult")
  const [groupInvite, setGroupInvite] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [members, setMembers] = useState<{ first_name: string; last_name: string }[]>([])
  const supabase = createClient()
  const router = useRouter()

  const reset = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setPhone("")
    setGuestType("adult")
    setGroupInvite(false)
    setGroupName("")
    setMembers([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return
    setLoading(true)
    try {
      // Create primary guest first and return its id
      const { data: createdGuests, error: guestErr } = await supabase
        .from("guests")
        .insert({
          wedding_id: weddingId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email || null,
          phone: phone || null,
          guest_type: guestType,
        })
        .select("id")
        .limit(1)
      if (guestErr) throw guestErr
      const primaryId = createdGuests?.[0]?.id as string | undefined
      if (!primaryId) throw new Error("Nuk u krijua mysafiri kryesor")

      // If group invite, create group and attach members
      if (groupInvite) {
        const { data: createdGroup, error: groupErr } = await supabase
          .from("guest_groups")
          .insert({
            wedding_id: weddingId,
            name: groupName || null,
            primary_guest_id: primaryId,
          })
          .select("id")
          .limit(1)
        if (groupErr) throw groupErr
        const groupId = createdGroup?.[0]?.id as string

        // Update primary guest with group_id
        const { error: updErr } = await supabase
          .from("guests")
          .update({ group_id: groupId })
          .eq("id", primaryId)
        if (updErr) throw updErr

        // Insert members
        const membersToAdd = members
          .filter(m => m.first_name.trim() || m.last_name.trim())
          .map(m => ({
            wedding_id: weddingId,
            first_name: m.first_name.trim() || "",
            last_name: m.last_name.trim() || "",
            guest_type: "adult",
            group_id: groupId,
          }))
        if (membersToAdd.length > 0) {
          const { error: memErr } = await supabase.from("guests").insert(membersToAdd)
          if (memErr) throw memErr
        }
      }

      reset()
      setOpen(false)
      onAdded?.()
      router.refresh()
    } catch (err) {
      console.error("Add guest error", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-[#4338CA] to-[#2563EB] text-white">
          + Shto Mysafir
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Shto Mysafir</DialogTitle>
        </DialogHeader>
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
          {/* Group Invitation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input id="groupInvite" type="checkbox" checked={groupInvite} onChange={(e) => setGroupInvite(e.target.checked)} />
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
                      <div key={idx} className="grid grid-cols-2 gap-2">
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Anulo</Button>
            <Button type="submit" disabled={loading}>{loading ? "Duke shtuar..." : "Shto"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
