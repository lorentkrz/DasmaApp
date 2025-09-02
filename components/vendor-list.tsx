"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Edit, Trash2, Phone, Mail, MapPin, Star, Store } from "lucide-react"
import Link from "next/link"

interface VendorListProps {
  vendors: any[]
  onEdit?: (vendor: any) => void
}

// Use DB enum codes for filtering, show labels in UI
const VENDOR_CATEGORIES = [
  "all",
  "photographer",
  "videographer",
  "florist",
  "caterer",
  "venue",
  "dj",
  "band",
  "baker",
  "decorator",
  "transportation",
  "other",
]

export function VendorList({ vendors, onEdit }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const labelize = (code: string) => code.charAt(0).toUpperCase() + code.slice(1)

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      considering: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
      contacted: "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300 shadow-sm",
      booked: "bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border-emerald-300 shadow-sm",
      cancelled: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
    }
    return colors[status] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm"
  }

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      photographer: "bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border-purple-300 shadow-sm",
      videographer: "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-800 border-indigo-300 shadow-sm",
      florist: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm",
      caterer: "bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-300 shadow-sm",
      venue: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm",
      dj: "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300 shadow-sm",
      band: "bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-800 border-teal-300 shadow-sm",
      baker: "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300 shadow-sm",
      decorator: "bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 border-violet-300 shadow-sm",
      transportation: "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300 shadow-sm",
      other: "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm",
    }
    return colors[category] || "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300 shadow-sm"
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Search and Filter */}
      <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                placeholder="Kërko shitës sipas emrit, kompanisë apo personit të kontaktit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-xl border-slate-200 bg-white/80 backdrop-blur-sm focus:border-slate-300 focus:ring-slate-200 shadow-lg"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white/80 backdrop-blur-sm shadow-lg font-medium"
              >
                {VENDOR_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "Të gjitha kategoritë" : labelize(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Vendor Grid */}
      {filteredVendors.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-slate-100 to-gray-100 rounded-full flex items-center justify-center">
                <Store className="h-8 w-8 text-slate-400" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-700">
                  Nuk u gjetën shitës
                </p>
                <p className="text-gray-500">
                  <span>Shërbimet tuaja të veçanta për dasmën e përsosër</span> filluar menaxhimin e ekipit të dasmës
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="rounded-2xl border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all transform hover:scale-105">
              <CardHeader className="pb-4 bg-gradient-to-r from-slate-100/30 to-gray-100/30 rounded-t-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-900">{vendor.name}</CardTitle>
                    {vendor.company && <p className="text-sm text-gray-600 font-medium">{vendor.company}</p>}
                  </div>
                  <Badge variant="outline" className={`${getCategoryColor(vendor.category)} font-medium`}>
                    {labelize(vendor.category)}
                  </Badge>
                </div>

                {vendor.rating && (
                  <div className="flex items-center space-x-1 mt-3">
                    {renderStars(vendor.rating)}
                    <span className="text-sm text-gray-600 ml-2 font-medium">({vendor.rating}/5)</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-5 p-6">
                {/* Enhanced Contact Information */}
                <div className="space-y-3">
                  {vendor.contact_person && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-gray-600" />
                      </div>
                      <span className="font-medium">{vendor.contact_person}</span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${vendor.phone}`} className="hover:underline font-medium">
                        {vendor.phone}
                      </a>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${vendor.email}`} className="hover:underline font-medium">
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.address && (
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Enhanced Status and Price */}
                <div className="flex items-center justify-between bg-gray-50/50 p-3 rounded-xl">
                  <Badge variant="outline" className={`${getStatusColor(vendor.status)} font-medium`}>
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
                  </div>
                </div>

                {/* Enhanced Notes */}
                {vendor.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg line-clamp-2">
                    {vendor.notes}
                  </p>
                )}

                {/* Enhanced Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/50">
                  <div className="flex items-center space-x-2">
                    {onEdit ? (
                      <Button variant="outline" size="sm" onClick={() => onEdit(vendor)} className="rounded-xl hover:bg-blue-50 border-blue-200">
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                    ) : (
                      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                        <Button variant="outline" size="sm" className="rounded-xl hover:bg-blue-50 border-blue-200">
                          <Edit className="h-4 w-4 text-blue-500" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
      
      {/* Enhanced Footer */}
      {filteredVendors.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center">
          <div className="flex items-center justify-center gap-2">
            <Store className="h-5 w-5 text-slate-500" />
            <span className="text-gray-700 font-medium">
              Duke shfaqur <span className="font-bold text-slate-600">{filteredVendors.length}</span> nga <span className="font-bold text-gray-800">{vendors.length}</span> shitës
            </span>
            <Store className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      )}
    </div>
  )
}
