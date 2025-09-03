"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Plus, Gift, TrendingUp, Users, Calendar } from "lucide-react"
import { toast } from "sonner"

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
          guest_name: guestName || guests.find(g => g.id === selectedGuest)?.name || null,
          amount: parseFloat(amount),
          amount_currency: "EUR",
          gift_date: giftDate || new Date().toISOString().split('T')[0],
          notes,
          created_by: user.id,
        })

      if (error) throw error

      toast.success("Dhurata u shtua me sukses!")
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
      toast.error("Gabim në shtimin e dhuratës")
    } finally {
      setLoading(false)
    }
  }

  const totalAmount = cashGifts.reduce((sum, gift) => sum + gift.amount, 0)
  const averageGift = cashGifts.length > 0 ? totalAmount / cashGifts.length : 0

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Add Gift Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Dhurata në Para (Bakshish)</h3>
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
                <Label htmlFor="gift_date">Data</Label>
                <Input
                  id="gift_date"
                  type="date"
                  value={giftDate}
                  onChange={(e) => setGiftDate(e.target.value)}
                  required
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
        {cashGifts.map((gift) => (
          <Card key={gift.id} className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-800">
                    {gift.guest ? `${gift.guest.first_name} ${gift.guest.last_name}` : 'Anonim'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(gift.gift_date).toLocaleDateString('sq-AL')}
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                  €{gift.amount.toLocaleString()}
                </Badge>
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
    </div>
  )
}
