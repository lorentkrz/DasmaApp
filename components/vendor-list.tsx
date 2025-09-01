"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Edit, Trash2, Phone, Mail, MapPin, Star } from "lucide-react"
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
      considering: "bg-gray-100 text-gray-800",
      contacted: "bg-blue-100 text-blue-800",
      booked: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {VENDOR_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : labelize(category)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vendor Grid */}
      {filteredVendors.length === 0 ? (
        <Card className="border-slate-200">
          <CardContent className="text-center py-12">
            <div className="text-gray-500">
              <div className="h-12 w-12 mx-auto mb-4 text-gray-300">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium">No vendors found</p>
              <p className="text-sm">Add your first vendor to start managing your wedding team</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-slate-900">{vendor.name}</CardTitle>
                    {vendor.company && <p className="text-sm text-gray-600">{vendor.company}</p>}
                  </div>
                  <Badge className="bg-gray-100 text-gray-800">{labelize(vendor.category)}</Badge>
                </div>

                {vendor.rating && (
                  <div className="flex items-center space-x-1 mt-2">
                    {renderStars(vendor.rating)}
                    <span className="text-sm text-gray-600 ml-2">({vendor.rating}/5)</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Contact Information */}
                <div className="space-y-2">
                  {vendor.contact_person && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-amber-600" />
                      </div>
                      <span>{vendor.contact_person}</span>
                    </div>
                  )}

                  {vendor.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${vendor.phone}`} className="hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  )}

                  {vendor.email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${vendor.email}`} className="hover:underline">
                        {vendor.email}
                      </a>
                    </div>
                  )}

                  {vendor.address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Status and Price */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(vendor.status)}>{vendor.status}</Badge>
                  {vendor.contract_amount && (
                    <span className="text-sm font-medium text-gray-900">${Number(vendor.contract_amount).toLocaleString()}</span>
                  )}
                </div>

                {/* Notes */}
                {vendor.notes && <p className="text-sm text-gray-600 line-clamp-2">{vendor.notes}</p>}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    {onEdit ? (
                      <Button variant="outline" size="sm" onClick={() => onEdit(vendor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {vendor.final_payment_due && (
                    <span className="text-xs text-gray-500">
                      Final due: {new Date(vendor.final_payment_due).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
