"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StandardTable } from "@/components/ui/standard-table"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { DatePicker } from "@/components/ui/date-picker"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, CreditCard, Calendar, FileText, Trash2 } from "lucide-react"

interface VendorPaymentsListProps {
  payments: any[]
  vendors: any[]
  weddingId: string
}

export function VendorPaymentsList({ payments, vendors, weddingId }: VendorPaymentsListProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vendor_id: "",
    amount: "",
    payment_date: new Date().toISOString(),
    payment_method: "cash",
    description: "",
    receipt_number: ""
  })
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  
  const paymentMethods = [
    { label: "Para në dorë", value: "cash" },
    { label: "Transfer bankar", value: "bank_transfer" },
    { label: "Kartë krediti", value: "credit_card" },
    { label: "Çek", value: "check" }
  ]
  
  const vendorOptions = vendors.map(v => ({
    label: v.name,
    value: v.id
  }))
  
  const handleSubmit = async () => {
    if (!formData.vendor_id || !formData.amount) {
      toast({
        title: "Gabim",
        description: "Ju lutem plotësoni fushat e detyrueshme",
        variant: "destructive"
      })
      return
    }
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from("vendor_payments")
        .insert({
          wedding_id: weddingId,
          vendor_id: formData.vendor_id,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          description: formData.description,
          receipt_number: formData.receipt_number
        })
      
      if (error) throw error
      
      toast({
        title: "Pagesa u regjistrua",
        description: "Pagesa u regjistrua me sukses"
      })
      
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating payment:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të regjistrohej pagesa",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (paymentId: string) => {
    if (!confirm("Jeni të sigurt që doni të fshini këtë pagesë?")) return
    
    try {
      const { error } = await supabase
        .from("vendor_payments")
        .delete()
        .eq("id", paymentId)
      
      if (error) throw error
      
      toast({
        title: "Pagesa u fshi",
        description: "Pagesa u fshi me sukses"
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të fshihej pagesa",
        variant: "destructive"
      })
    }
  }
  
  // Calculate totals
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const paymentsByVendor = payments.reduce((acc, p) => {
    const vendorName = p.vendor?.name || "Unknown"
    acc[vendorName] = (acc[vendorName] || 0) + Number(p.amount || 0)
    return acc
  }, {})
  
  // Table columns
  const columns = [
    {
      key: "vendor",
      label: "Shitësi",
      accessor: (row: any) => row.vendor?.name || "-",
      header: "Shitësi",
      sortable: true
    },
    {
      key: "amount",
      label: "Shuma",
      accessor: (row: any) => `€${Number(row.amount).toLocaleString()}`,
      header: "Shuma",
      sortable: true
    },
    {
      key: "payment_date",
      label: "Data",
      accessor: (row: any) => new Date(row.payment_date).toLocaleDateString('sq-AL'),
      header: "Data",
      sortable: true
    },
    {
      key: "payment_method",
      label: "Metoda",
      accessor: (row: any) => {
        const methods = {
          cash: "Para në dorë",
          bank_transfer: "Transfer",
          credit_card: "Kartë",
          check: "Çek"
        }
        return methods[row.payment_method] || row.payment_method
      },
      header: "Metoda",
      sortable: true
    },
    {
      key: "receipt_number",
      label: "Nr. Faturës",
      accessor: (row: any) => row.receipt_number || "-",
      header: "Nr. Faturës",
      sortable: false
    },
    {
      key: "actions",
      label: "Veprime",
      accessor: (row: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDelete(row.id)}
          className="text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      ),
      header: "Veprime",
      sortable: false
    }
  ]
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pagesa Totale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalPayments.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{payments.length} pagesa</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Shitës me Pagesa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(paymentsByVendor).length}</div>
            <p className="text-xs text-gray-500 mt-1">nga {vendors.length} total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pagesa Mesatare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{payments.length > 0 ? Math.round(totalPayments / payments.length).toLocaleString() : 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">për pagesë</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Lista e Pagesave</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Shto Pagesë
        </Button>
      </div>
      
      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <StandardTable
            columns={columns}
            data={payments}
            pageSize={10}
          />
        </CardContent>
      </Card>
      
      {/* Add Payment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shto Pagesë të Re</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Shitësi *</Label>
              <StandardDropdown
                value={formData.vendor_id}
                onValueChange={(value) => setFormData({ ...formData, vendor_id: Array.isArray(value) ? value[0] : value })}
                options={vendorOptions}
                placeholder="Zgjidhni shitësin"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Shuma (€) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data e Pagesës</Label>
              <DatePicker
                value={new Date(formData.payment_date)}
                onChange={(date) => setFormData({ ...formData, payment_date: date?.toISOString() || new Date().toISOString() })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Metoda e Pagesës</Label>
              <StandardDropdown
                value={formData.payment_method}
                onValueChange={(value) => setFormData({ ...formData, payment_method: Array.isArray(value) ? value[0] : value })}
                options={paymentMethods}
                placeholder="Zgjidhni metodën"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Nr. Faturës</Label>
              <Input
                value={formData.receipt_number}
                onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                placeholder="p.sh. INV-001"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Përshkrimi</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Përshkrimi i pagesës"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anulo
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Duke ruajtur..." : "Ruaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
