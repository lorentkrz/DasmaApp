"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save, Star } from "lucide-react"
import Link from "next/link"

interface VendorFormProps {
  wedding: any
  vendor?: any
  onSuccess?: () => void
}

// Match DB enum values (see scripts/007_create_vendors.sql)
const VENDOR_CATEGORY_VALUES = [
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
] as const

const VENDOR_STATUS_VALUES = ["considering", "contacted", "booked", "cancelled"] as const

export function VendorForm({ wedding, vendor, onSuccess }: VendorFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: vendor?.name || "",
    category: (vendor?.category as string | undefined) || "other",
    contact_person: vendor?.contact_person || "",
    phone: vendor?.phone || "",
    email: vendor?.email || "",
    website: vendor?.website || "",
    address: vendor?.address || "",
    status: (vendor?.status as string | undefined) || "considering",
    contract_amount: vendor?.contract_amount?.toString?.() || "",
    deposit_amount: vendor?.deposit_amount?.toString?.() || "",
    deposit_paid: vendor?.deposit_paid ?? false,
    final_payment_due: vendor?.final_payment_due || "",
    contract_signed: vendor?.contract_signed ?? false,
    contract_url: vendor?.contract_url || "",
    rating: vendor?.rating || 0,
    notes: vendor?.notes || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const vendorData = {
        name: formData.name,
        category: formData.category,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        address: formData.address || null,
        contract_amount: formData.contract_amount ? Number.parseFloat(formData.contract_amount) : null,
        deposit_amount: formData.deposit_amount ? Number.parseFloat(formData.deposit_amount) : null,
        deposit_paid: !!formData.deposit_paid,
        final_payment_due: formData.final_payment_due || null,
        contract_signed: !!formData.contract_signed,
        contract_url: formData.contract_url || null,
        rating: formData.rating || null,
        notes: formData.notes || null,
        status: formData.status,
        wedding_id: wedding.id,
      }

      if (vendor) {
        // Update existing vendor
        const { error } = await supabase.from("vendors").update(vendorData).eq("id", vendor.id)

        if (error) throw error
      } else {
        // Create new vendor
        const { error } = await supabase.from("vendors").insert([vendorData])

        if (error) throw error
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push("/dashboard/vendors")
      }
      router.refresh()
    } catch (error) {
      console.error("Error saving vendor:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating })
  }

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/vendors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <CardTitle className="text-slate-900">{vendor ? "Edit Vendor" : "New Vendor"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Vendor Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John's Photography"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {VENDOR_CATEGORY_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                {VENDOR_STATUS_VALUES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Contact Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@photography.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://photography.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State 12345"
              />
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Business Details</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contract_amount">Contract Amount</Label>
                <Input
                  id="contract_amount"
                  type="number"
                  step="0.01"
                  value={formData.contract_amount}
                  onChange={(e) => setFormData({ ...formData, contract_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit_amount">Deposit Amount</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  step="0.01"
                  value={formData.deposit_amount}
                  onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  id="deposit_paid"
                  type="checkbox"
                  checked={formData.deposit_paid}
                  onChange={(e) => setFormData({ ...formData, deposit_paid: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                />
                <Label htmlFor="deposit_paid">Deposit Paid</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="final_payment_due">Final Payment Due</Label>
                <Input
                  id="final_payment_due"
                  type="date"
                  value={formData.final_payment_due}
                  onChange={(e) => setFormData({ ...formData, final_payment_due: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  id="contract_signed"
                  type="checkbox"
                  checked={formData.contract_signed}
                  onChange={(e) => setFormData({ ...formData, contract_signed: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500"
                />
                <Label htmlFor="contract_signed">Contract Signed</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_url">Contract URL</Label>
                <Input
                  id="contract_url"
                  type="url"
                  value={formData.contract_url}
                  onChange={(e) => setFormData({ ...formData, contract_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <button key={i} type="button" onClick={() => handleRatingClick(i + 1)} className="focus:outline-none">
                    <Star
                      className={`h-6 w-6 ${i < formData.rating ? "text-yellow-400 fill-current" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {formData.rating > 0 ? `${formData.rating}/5` : "No rating"}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about this vendor..."
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/vendors">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Saving..." : vendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
