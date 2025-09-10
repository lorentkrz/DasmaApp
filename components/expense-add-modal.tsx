"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface ExpenseAddModalProps {
  wedding: any
  categories: { id: string; name: string }[]
  vendors?: { id: string; name: string }[]
}

export function ExpenseAddModal({ wedding, categories, vendors = [] }: ExpenseAddModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category_id: "",
    expense_date: new Date().toISOString().split("T")[0],
    is_paid: false,
    notes: "",
    is_deposit: false,
    vendor_id: "",
  })

  const [cats, setCats] = useState<{ id: string; name: string }[]>(categories)
  const [vend, setVend] = useState<{ id: string; name: string }[]>(vendors)

  useEffect(() => {
    setCats(categories)
  }, [categories])

  useEffect(() => {
    setVend(vendors)
  }, [vendors])

  // Fallback fetch if not provided
  useEffect(() => {
    ;(async () => {
      if (cats.length === 0) {
        const { data } = await supabase
          .from("budget_categories")
          .select("id,name")
          .eq("wedding_id", wedding.id)
          .order("name")
        if (data) setCats(data as any)
      }
      if (vend.length === 0) {
        const { data } = await supabase
          .from("vendors")
          .select("id,name")
          .eq("wedding_id", wedding.id)
          .order("name")
        if (data) setVend(data as any)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) return
    setLoading(true)
    try {
      const amountNum = Number.parseFloat(form.amount)
      const { data: inserted, error } = await supabase.from("expenses").insert([
        {
          wedding_id: wedding.id,
          description: form.description,
          amount: amountNum,
          expense_date: form.expense_date,
          payment_status: form.is_paid ? "paid" : "pending",
          payment_method: form.is_deposit ? "deposit" : null,
          notes: form.notes || null,
          category_id: form.category_id || null,
          vendor_id: form.vendor_id || null,
        },
      ]).select("id").limit(1)
      if (error) throw error

      // Vendor bookkeeping for deposits
      if (form.is_deposit && form.vendor_id) {
        const { data: vendorRows, error: vErr } = await supabase
          .from("vendors")
          .select("deposit_amount, deposit_paid")
          .eq("id", form.vendor_id)
          .limit(1)
        if (!vErr) {
          const currentDeposit = Number(vendorRows?.[0]?.deposit_amount || 0)
          const newDeposit = currentDeposit + amountNum
          await supabase
            .from("vendors")
            .update({ deposit_amount: newDeposit, deposit_paid: true, updated_at: new Date().toISOString() })
            .eq("id", form.vendor_id)
        }
      }
      setOpen(false)
      router.refresh()
      setForm({ description: "", amount: "", category_id: "", expense_date: new Date().toISOString().split("T")[0], is_paid: false, notes: "", is_deposit: false, vendor_id: "" })
    } catch (err) {
      console.error("Add expense error", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white border-0">
          + Shto Shpenzim
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Shto Shpenzim</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Përshkrimi *</Label>
              <Input id="description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Shuma *</Label>
              <Input id="amount" type="number" step="0.01" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">Data *</Label>
              <Input id="expense_date" type="date" value={form.expense_date} onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Kategoria</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((p) => ({ ...p, category_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pa kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shitësi (opsionale)</Label>
              <Select value={form.vendor_id} onValueChange={(v) => setForm((p) => ({ ...p, vendor_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pa shitës" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Depozitë</Label>
              <div className="flex items-center gap-2">
                <input id="is_deposit" type="checkbox" checked={form.is_deposit} onChange={(e) => setForm(p => ({ ...p, is_deposit: e.target.checked }))} />
                <Label htmlFor="is_deposit">Shëno si depozitë</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Shënime</Label>
            <Textarea id="notes" rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>

          <div className="flex items-center gap-2">
            <Switch id="is_paid" checked={form.is_paid} onCheckedChange={(checked) => setForm((p) => ({ ...p, is_paid: checked }))} />
            <Label htmlFor="is_paid">Paguar</Label>
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
