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
        guest:guests(first_name, last_name)
      `)
      .eq('wedding_id', weddingId)
      .order('gift_date', { ascending: false })

    if (error) {
      console.error('Error fetching cash gifts:', error)
      toast.error('Gabim në ngarkimin e dhuratave')
      return
    }

    setCashGifts(data || [])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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
      {/* Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Totali</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-800">€{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-emerald-600">Të gjitha dhuratave</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Mesatarja</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">€{averageGift.toFixed(0)}</div>
            <p className="text-xs text-blue-600">Për dhuratë</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Dhurues</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-800">{cashGifts.length}</div>
            <p className="text-xs text-purple-600">Persona</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Gift Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Dhurata në Para</h3>
        <Dialog open={isAddingGift} onOpenChange={setIsAddingGift}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg">
              <Plus className="h-4 w-4 mr-2" />
              Shto Dhuratë
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-600" />
                Shto Dhuratë të Re
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="guest-select">Mysafiri (opsionale)</Label>
                <Select value={selectedGuest} onValueChange={setSelectedGuest}>
                  <SelectTrigger>
                    <SelectValue placeholder="Zgjidhni mysafirin..." />
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

              <div className="space-y-2">
                <Label htmlFor="guest-name">Ose shkruani emrin</Label>
                <Input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Emri i dhuruesit..."
                  disabled={!!selectedGuest}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Shuma (EUR)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gift-date">Data e Dhuratës</Label>
                <Input
                  id="gift-date"
                  type="date"
                  value={giftDate}
                  onChange={(e) => setGiftDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Shënime (opsionale)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Shënime shtesë..."
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddingGift(false)}
                  className="flex-1"
                >
                  Anulo
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
                >
                  {loading ? "Duke shtuar..." : "Shto Dhuratë"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Gifts List - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cashGifts.map((gift) => (
          <Card key={gift.id} className="bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-md hover:shadow-lg transition-all">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {gift.guest?.first_name && gift.guest?.last_name 
                      ? `${gift.guest.first_name} ${gift.guest.last_name}`
                      : gift.guest_name || 'Dhurues Anonim'
                    }
                  </h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(gift.gift_date).toLocaleDateString('sq-AL')}
                  </p>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold">
                  €{gift.amount.toLocaleString()}
                </Badge>
              </div>
              {gift.notes && (
                <p className="text-sm text-gray-600 italic border-l-2 border-emerald-200 pl-3">
                  "{gift.notes}"
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {cashGifts.length === 0 && (
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardContent className="p-8 text-center">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Asnjë dhuratë ende</h3>
            <p className="text-gray-500">Shtoni dhuratën e parë në para për dasmën tuaj</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
