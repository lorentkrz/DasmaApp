'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, CreditCard, Receipt } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VendorPaymentFormProps {
  vendor: any
  wedding: any
  onSuccess?: () => void
}

export function VendorPaymentForm({ vendor, wedding, onSuccess }: VendorPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    description: '',
    receipt_number: '',
    notes: ''
  })
  
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('vendor_payments')
        .insert({
          vendor_id: vendor.id,
          wedding_id: wedding.id,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          description: formData.description || `Pagesë për ${vendor.name}`,
          receipt_number: formData.receipt_number,
          notes: formData.notes
        })

      if (error) throw error

      toast({
        title: "Pagesa u regjistrua!",
        description: `Pagesa prej €${formData.amount} për ${vendor.name} u shtua me sukses.`,
      })

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/vendors')
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding payment:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të shtojmë pagesën. Provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalPaid = vendor.deposit_amount || 0
  const remainingAmount = (vendor.contract_amount || 0) - totalPaid
  const progressPercentage = vendor.contract_amount > 0 ? (totalPaid / vendor.contract_amount) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Shto Pagesë për {vendor.name}
        </CardTitle>
        
        {/* Payment Progress */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span>Paguar: €{totalPaid.toLocaleString()}</span>
            <span>Mbetur: €{remainingAmount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 text-center">
            {progressPercentage.toFixed(1)}% e kontratës së paguar
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Shuma e Pagesës *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={remainingAmount}
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500">
                Maksimumi: €{remainingAmount.toLocaleString()}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_date">Data e Pagesës</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Mënyra e Pagesës</Label>
              <Select 
                value={formData.payment_method} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Para në dorë</SelectItem>
                  <SelectItem value="bank_transfer">Transfer bankar</SelectItem>
                  <SelectItem value="card">Kartë</SelectItem>
                  <SelectItem value="check">Çek</SelectItem>
                  <SelectItem value="other">Tjetër</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt_number">Numri i Faturës</Label>
              <Input
                id="receipt_number"
                placeholder="F001234"
                value={formData.receipt_number}
                onChange={(e) => setFormData(prev => ({ ...prev, receipt_number: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Përshkrimi</Label>
            <Input
              id="description"
              placeholder={`Pagesë për ${vendor.name}`}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Shënime</Label>
            <Textarea
              id="notes"
              placeholder="Shënime shtesë për pagesën..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Duke ruajtur...' : 'Ruaj Pagesën'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onSuccess ? onSuccess() : router.back()}
            >
              Anulo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
