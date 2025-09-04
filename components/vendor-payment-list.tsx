'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, Calendar, CreditCard, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { VendorPaymentForm } from './vendor-payment-form'

interface VendorPaymentListProps {
  vendor: any
  wedding: any
}

export function VendorPaymentList({ vendor, wedding }: VendorPaymentListProps) {
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_payments')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [vendor.id])

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Jeni të sigurt që doni të fshini këtë pagesë?')) return

    try {
      const { error } = await supabase
        .from('vendor_payments')
        .delete()
        .eq('id', paymentId)

      if (error) throw error

      toast({
        title: "Pagesa u fshi!",
        description: "Pagesa u fshi me sukses.",
      })

      fetchPayments() // Refresh the list
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast({
        title: "Gabim",
        description: "Nuk mundëm të fshijmë pagesën. Provoni përsëri.",
        variant: "destructive",
      })
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Para në dorë',
      bank_transfer: 'Transfer bankar',
      card: 'Kartë',
      check: 'Çek',
      other: 'Tjetër'
    }
    return methods[method] || method
  }

  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
  const remainingAmount = (vendor.contract_amount || 0) - totalPaid
  const progressPercentage = vendor.contract_amount > 0 ? (totalPaid / vendor.contract_amount) * 100 : 0

  if (showAddForm) {
    return (
      <VendorPaymentForm 
        vendor={vendor} 
        wedding={wedding} 
        onSuccess={() => {
          setShowAddForm(false)
          fetchPayments()
        }}
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Pagesat për {vendor.name}
          </CardTitle>
          <Button 
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Shto Pagesë
          </Button>
        </div>
        
        {/* Payment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">€{totalPaid.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Paguar</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">€{remainingAmount.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Mbetur</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">€{(vendor.contract_amount || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-600">Totali</div>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 text-center">
            {progressPercentage.toFixed(1)}% e kontratës së paguar
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Duke ngarkuar pagesat...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Asnjë pagesë e regjistruar ende</p>
            <p className="text-sm">Klikoni "Shto Pagesë" për të filluar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-green-600">
                        €{Number(payment.amount).toLocaleString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(payment.payment_date).toLocaleDateString('sq-AL')}
                      </div>
                    </div>
                    
                    {payment.description && (
                      <p className="text-sm text-gray-700 mb-1">{payment.description}</p>
                    )}
                    
                    {payment.receipt_number && (
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <Receipt className="h-3 w-3 mr-1" />
                        Faturë: {payment.receipt_number}
                      </div>
                    )}
                    
                    {payment.notes && (
                      <p className="text-xs text-gray-500 italic">{payment.notes}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePayment(payment.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
