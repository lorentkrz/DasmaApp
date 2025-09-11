"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Plus, Gift, TrendingUp, Users, Calendar, Trash2, Edit } from "lucide-react"

interface CashGift {
  id: string
  guest_id: string | null
  guest_name: string | null
  amount: number
  amount_currency: string
  gift_date: string
  notes: string | null
  guest?: {
    first_name: string
    last_name: string
  }
}

interface CashGiftsTrackerProps {
  weddingId: string
  guests: any[]
}

export function CashGiftsTracker({ weddingId, guests }: CashGiftsTrackerProps) {
  const [cashGifts, setCashGifts] = useState<CashGift[]>([])
  const [isAddingGift, setIsAddingGift] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState('')
  const [guestName, setGuestName] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [giftDate, setGiftDate] = useState(new Date().toISOString().split('T')[0])
  const [editingGift, setEditingGift] = useState<CashGift | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState(new Date().toISOString().split('T')[0])
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  // Display strings in EU format DD/MM/YYYY
  const [startDateInput, setStartDateInput] = useState<string>('')
  const [endDateInput, setEndDateInput] = useState<string>('')
  const [giftDateInput, setGiftDateInput] = useState<string>('')
  const [editDateInput, setEditDateInput] = useState<string>('')

  // Helpers for EU date format parsing/formatting
  const toEU = (iso: string | undefined | null) => {
    if (!iso) return ''
    const parts = iso.split('-')
    if (parts.length !== 3) return ''
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  const parseEU = (eu: string): string | null => {
    const m = eu.match(/^\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\s*$/)
    if (!m) return null
    let d = m[1].padStart(2, '0')
    let mo = m[2].padStart(2, '0')
    const y = m[3]
    // Basic bounds check
    const di = parseInt(d, 10)
    const mi = parseInt(mo, 10)
    if (mi < 1 || mi > 12 || di < 1 || di > 31) return null
    return `${y}-${mo}-${d}`
  }

  useEffect(() => { setStartDateInput(toEU(startDate)) }, [startDate])
  useEffect(() => { setEndDateInput(toEU(endDate)) }, [endDate])
  useEffect(() => { setGiftDateInput(toEU(giftDate)) }, [giftDate])
  useEffect(() => { setEditDateInput(toEU(editDate)) }, [editDate])
  const supabase = createClient()

  useEffect(() => {
    fetchCashGifts()
  }, [weddingId])

  const fetchCashGifts = async () => {
    const { data, error } = await supabase
      .from('cash_gifts')
      .select(`
        *,
        guest:guest_id(first_name, last_name)
      `)
      .eq('wedding_id', weddingId)
      .order('gift_date', { ascending: false })

    if (error) {
      console.error('Error fetching cash gifts:', error)
      return
    }

    setCashGifts(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase
        .from("cash_gifts")
        .insert({
          wedding_id: weddingId,
          guest_id: selectedGuest || null,
          guest_name: selectedGuest 
            ? `${guests.find(g => g.id === selectedGuest)?.first_name || ''} ${guests.find(g => g.id === selectedGuest)?.last_name || ''}`.trim()
            : guestName || 'Anonim',
          amount: parseFloat(amount),
          amount_currency: "EUR",
          gift_date: giftDate || new Date().toISOString().split('T')[0],
          notes,
          // Ensure compliance with schema that may require created_by
          created_by: user.id,
        })

      if (error) throw error

      toast.success("Cash gift added successfully!")
      setIsAddingGift(false)
      setSelectedGuest("")
      setGuestName("")
      setAmount("")
      setNotes("")
      setGiftDate(new Date().toISOString().split('T')[0])
      
      // Refresh data
      fetchCashGifts()
    } catch (error) {
      console.error("Error adding cash gift:", error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      // Common causes: RLS owner-only policy or created_by missing
      toast.error(`Error adding cash gift: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGift = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('cash_gifts')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error("Error deleting cash gift:", deleteError)
        toast.error(`Error deleting cash gift: ${deleteError.message}`)
        return
      }

      setCashGifts(cashGifts.filter((gift) => gift.id !== id))
      toast.success("Cash gift deleted successfully!")
    } catch (error) {
      console.error("Error deleting cash gift:", error)
      toast.error(`Error deleting cash gift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const openEditGift = (gift: CashGift) => {
    setEditingGift(gift)
    setEditAmount(String(gift.amount))
    setEditNotes(gift.notes || '')
    setEditDate(gift.gift_date?.split('T')[0] || new Date().toISOString().split('T')[0])
  }

  const handleUpdateGift = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGift) return
    try {
      const { error: updateError } = await supabase
        .from('cash_gifts')
        .update({
          amount: parseFloat(editAmount),
          notes: editNotes,
          gift_date: editDate,
        })
        .eq('id', editingGift.id)

      if (updateError) throw updateError

      toast.success('Cash gift updated successfully!')
      setEditingGift(null)
      // Refresh list
      fetchCashGifts()
    } catch (error) {
      console.error('Error updating cash gift:', error)
      toast.error(`Error updating cash gift: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const totalAmount = cashGifts.reduce((sum, gift) => sum + gift.amount, 0)
  const averageGift = cashGifts.length > 0 ? totalAmount / cashGifts.length : 0

  const filteredGifts = cashGifts.filter((g) => {
    const d = new Date(g.gift_date).toISOString().split('T')[0]
    const afterStart = startDate ? d >= startDate : true
    const beforeEnd = endDate ? d <= endDate : true
    return afterStart && beforeEnd
  })

  const downloadCsv = () => {
    const rows = [
      ['id','guest_name','amount','gift_date','notes'],
      ...filteredGifts.map(g => [
        g.id,
        g.guest ? `${g.guest.first_name} ${g.guest.last_name}` : (g.guest_name || 'Anonim'),
        String(g.amount),
        new Date(g.gift_date).toISOString().split('T')[0],
        (g.notes || '').replace(/\n/g,' '),
      ])
    ]
    const csv = rows.map(r => r.map((c) => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cash_gifts.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-0">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Totali</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">€{totalAmount.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-xs text-emerald-600">+€{(totalAmount * 0.15).toFixed(0)} këtë javë</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Mesatarja</CardTitle>
            <Gift className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">€{averageGift.toFixed(0)}</div>
            <div className="text-xs text-blue-600 mt-1">për mysafir</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-violet-700">Dhurues</CardTitle>
            <Users className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-800">{cashGifts.length}</div>
            <div className="text-xs text-violet-600 mt-1">dhurata të regjistruara</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between relative z-10">
        <h3 className="text-lg font-semibold text-gray-800">Dhurata në Para (Bakshish)</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Prej</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={startDateInput}
            onChange={(e) => {
              const val = e.target.value
              setStartDateInput(val)
              const iso = parseEU(val)
              if (iso) setStartDate(iso)
              else if (val.trim() === '') setStartDate('')
            }}
            className="h-9 w-[140px]"
          />
          <label className="text-sm text-gray-700">Deri</label>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={endDateInput}
            onChange={(e) => {
              const val = e.target.value
              setEndDateInput(val)
              const iso = parseEU(val)
              if (iso) setEndDate(iso)
              else if (val.trim() === '') setEndDate('')
            }}
            className="h-9 w-[140px]"
          />
          <Button variant="outline" onClick={downloadCsv}>Shkarko CSV</Button>
        </div>
        <Dialog open={isAddingGift} onOpenChange={setIsAddingGift}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Shto Dhuratë
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Shto Dhuratë në Para</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="guest_id">Mysafiri (opsionale)</Label>
                <select
                  id="guest_id"
                  value={selectedGuest}
                  onChange={(e) => setSelectedGuest(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Zgjidhni mysafirin...</option>
                  {guests.map(guest => (
                    <option key={guest.id} value={guest.id}>
                      {guest.first_name} {guest.last_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="amount">Shuma (€)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="gift_date">Data (DD/MM/YYYY)</Label>
                <Input
                  id="gift_date"
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/YYYY"
                  value={giftDateInput}
                  onChange={(e) => {
                    const val = e.target.value
                    setGiftDateInput(val)
                    const iso = parseEU(val)
                    if (iso) setGiftDate(iso)
                  }}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="notes">Shënime (opsionale)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Duke shtuar...' : 'Shto Dhuratë'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gifts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGifts.map((gift) => (
          <Card key={gift.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-800">
                    {gift.guest ? `${gift.guest.first_name} ${gift.guest.last_name}` : 'Anonim'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(gift.gift_date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                    €{gift.amount.toLocaleString()}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => openEditGift(gift)} className="hover:bg-blue-50 border-blue-200">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteGift(gift.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {gift.notes && (
                <p className="text-sm text-gray-600 mt-2 italic">"{gift.notes}"</p>
              )}
            </CardContent>
          </Card>
        ))}
        
        {cashGifts.length === 0 && (
          <div className="col-span-full text-center py-8">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Asnjë dhuratë në para e regjistruar ende</p>
          </div>
        )}
      </div>
      {/* Edit Gift Dialog (global) */}
      <Dialog open={!!editingGift} onOpenChange={(open) => !open && setEditingGift(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Përditëso Dhuratën</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateGift} className="space-y-4">
            <div>
              <Label htmlFor="edit_amount">Shuma (€)</Label>
              <Input
                id="edit_amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_date">Data (DD/MM/YYYY)</Label>
              <Input
                id="edit_date"
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={editDateInput}
                onChange={(e) => {
                  const val = e.target.value
                  setEditDateInput(val)
                  const iso = parseEU(val)
                  if (iso) setEditDate(iso)
                }}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit_notes">Shënime</Label>
              <Textarea
                id="edit_notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditingGift(null)} className="flex-1">Anulo</Button>
              <Button type="submit" className="flex-1">Ruaj</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
