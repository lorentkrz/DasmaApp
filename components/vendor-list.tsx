"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Search, Filter, Edit, Trash2, Phone, Mail, MapPin, Star, Store } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface VendorListProps {
  vendors: any[]
  onEdit?: (vendor: any) => void
}

// Categories removed per request; keep UI minimal with only status filters

export function VendorList({ vendors, onEdit }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (vendorId: string, vendorName: string) => {
    try {
      setDeletingId(vendorId)
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId)

      if (error) throw error

      toast({
        title: "Shitësi u fshi!",
        description: `${vendorName} u largua me sukses nga lista.`,
      })

      router.refresh()
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast({
        title: "Gabim!",
        description: "Nuk u arrit të fshihet shitësi. Provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  const isOverdue = (vendor: any) => {
    try {
      const due = vendor.final_payment_due ? new Date(vendor.final_payment_due) : null
      const today = new Date()
      const total = Number(vendor.contract_amount || 0)
      const paid = Number(vendor.deposit_amount || 0)
      const remaining = total - paid
      return due && !Number.isNaN(due.getTime()) && due < today && remaining > 0
    } catch {
      return false
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const name = (vendor.name || "").toString().toLowerCase()
    const contact = (vendor.contact_person || "").toString().toLowerCase()
    const company = (vendor.company || "").toString().toLowerCase()
    const status = (vendor.status || "").toString()
    const query = (searchTerm || "").toString().toLowerCase()

    const matchesSearch =
      name.includes(query) ||
      contact.includes(query) ||
      company.includes(query)
    const matchesStatus = selectedStatus === "all" || status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const labelize = (code: string) => (code ? code.charAt(0).toUpperCase() + code.slice(1) : "")

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      considering: "bg-gray-100 text-gray-800 border-gray-200",
      contacted: "bg-blue-50 text-blue-800 border-blue-200",
      booked: "bg-green-50 text-green-800 border-green-200",
      cancelled: "bg-gray-100 text-gray-600 border-gray-200",
    }
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  // Category colors and badges removed

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Search and Status Filter (Categories removed) */}
      <Card className="border">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative sm:flex-[2]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Kërko shitës sipas emrit, kompanisë apo personit të kontaktit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10"
              />
            </div>
            <div className="sm:flex-[1] space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Filter className="h-4 w-4" />
                Statusi
              </div>
              <div className="flex items-center gap-1 bg-white/70 backdrop-blur border rounded-full p-0.5 shadow-sm overflow-x-auto">
                {["all","considering","contacted","booked","cancelled"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStatus(st)}
                    aria-pressed={selectedStatus === st}
                    className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${
                      selectedStatus === st
                        ? "bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 text-emerald-800"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    {st === "all" ? "Të gjitha" : labelize(st)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Vendor Grid */}
      {filteredVendors.length === 0 ? (
        <Card className="border">
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-gray-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Nuk u gjetën shitës
                </p>
                <p className="text-gray-500 text-sm">
                  Shtoni shitës për të menaxhuar ekipin e dasmës suaj
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="border hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{vendor.name}</CardTitle>
                    {vendor.company && <p className="text-sm text-gray-600 font-medium">{vendor.company}</p>}
                  </div>
                </div>

                {vendor.rating && (
                  <div className="flex items-center space-x-1 mt-3">
                    {renderStars(vendor.rating)}
                    <span className="text-sm text-gray-600 ml-2">({vendor.rating}/5)</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Enhanced Contact Information */}
                <div className="space-y-3">
                  {vendor.contact_person && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                      </div>
                      <span>{vendor.contact_person}</span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${vendor.phone}`} className="hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${vendor.email}`} className="hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.address && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Status and Price */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <Badge variant="outline" className={getStatusColor(vendor.status)}>
                    {vendor.status === 'considering' ? 'Duke menduar' : 
                     vendor.status === 'confirmed' ? 'Konfirmuar' :
                     vendor.status === 'booked' ? 'Rezervuar' :
                     vendor.status === 'cancelled' ? 'Anulluar' : vendor.status}
                  </Badge>
                  <div className="flex flex-col items-end">
                    {vendor.contract_amount && (
                      <span className="text-lg font-bold text-gray-900">${Number(vendor.contract_amount).toLocaleString()}</span>
                    )}
                    {vendor.deposit_amount && (
                      <span className="text-xs text-gray-500">Depozitë: ${Number(vendor.deposit_amount).toLocaleString()}</span>
                    )}
                    {isOverdue(vendor) && (
                      <span className="mt-1 inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                        Vonesa
                      </span>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {vendor.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg line-clamp-2">
                    {vendor.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    {onEdit ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onEdit(vendor)}
                        className="hover:bg-blue-50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="hover:bg-blue-50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Link href={`/dashboard/vendors/${vendor.id}/payments`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 shadow-sm transition-all duration-200 hover:shadow-md"
                      >
                        Pagesat
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-sm transition-all duration-200 hover:shadow-md"
                          disabled={deletingId === vendor.id}
                          aria-busy={deletingId === vendor.id}
                        >
                          {deletingId === vendor.id ? (
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25"/><path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.75"/></svg>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Fshi Shitësin</AlertDialogTitle>
                          <AlertDialogDescription>
                            Jeni të sigurt që doni të fshini "{vendor.name}"? Ky veprim nuk mund të zhbëhet.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anulo</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(vendor.id, vendor.name)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deletingId === vendor.id}
                          >
                            {deletingId === vendor.id ? 'Duke fshirë...' : 'Fshi'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {vendor.final_payment_due && (
                    <span className="text-xs text-gray-600 bg-amber-50 px-2 py-1 rounded-md">
                      Afati: {new Date(vendor.final_payment_due).toLocaleDateString('sq-AL')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Footer */}
      {filteredVendors.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border text-center">
          <div className="flex items-center justify-center gap-2">
            <Store className="h-4 w-4 text-gray-600" />
            <span className="text-gray-700 text-sm">
              Duke shfaqur <span className="font-medium">{filteredVendors.length}</span> nga <span className="font-medium">{vendors.length}</span> shitës
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
