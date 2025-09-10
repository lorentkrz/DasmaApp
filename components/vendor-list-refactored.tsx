"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { StandardTableEnhanced } from "@/components/standard-table-enhanced"
import { KPIGrid } from "@/components/dashboard/KPIGrid"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Store,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  User,
  CreditCard,
  Heart,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

interface VendorListProps {
  vendors: any[]
  onEdit?: (vendor: any) => void
  initialQuery?: string
}

const statusOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Duke menduar", value: "considering" },
  { label: "Kontaktuar", value: "contacted" },
  { label: "Rezervuar", value: "booked" },
  { label: "Anulluar", value: "cancelled" }
]

const categoryOptions = [
  { label: "Të gjitha", value: "all" },
  { label: "Fotografi", value: "photography" },
  { label: "Muzikë", value: "music" },
  { label: "Lule", value: "flowers" },
  { label: "Ushqim", value: "catering" },
  { label: "Veshje", value: "attire" },
  { label: "Tjetër", value: "other" }
]

export function VendorListRefactored({ vendors, onEdit, initialQuery }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState(initialQuery || "")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedView, setSelectedView] = useState("cards")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [vendorToDelete, setVendorToDelete] = useState<any>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (!vendorToDelete) return
    
    try {
      setDeletingId(vendorToDelete.id)
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorToDelete.id)

      if (error) throw error

      toast({
        title: "Shitësi u fshi!",
        description: `${vendorToDelete.name} u largua me sukses nga lista.`,
      })

      router.refresh()
      setDeleteDialogOpen(false)
      setVendorToDelete(null)
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
    const category = (vendor.category || "").toString()
    const status = (vendor.status || "").toString()
    const query = (searchTerm || "").toString().toLowerCase()

    const matchesSearch =
      name.includes(query) ||
      contact.includes(query) ||
      company.includes(query)
    const matchesStatus = selectedStatus === "all" || status === selectedStatus
    const matchesCategory = selectedCategory === "all" || category === selectedCategory
    
    return matchesSearch && matchesStatus && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      considering: { label: "Duke menduar", className: "bg-gray-100 text-gray-800" },
      contacted: { label: "Kontaktuar", className: "bg-blue-100 text-blue-800" },
      booked: { label: "Rezervuar", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Anulluar", className: "bg-red-100 text-red-800" }
    }
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      photography: "📸",
      music: "🎵",
      flowers: "🌺",
      catering: "🍽️",
      attire: "👗",
      other: "🎉"
    }
    return icons[category] || ""
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  // Table columns for list view
  const columns = [
    { key: "name", label: "Emri", sortable: true },
    { key: "category", label: "Kategoria", sortable: true },
    { key: "status", label: "Statusi", sortable: true },
    { key: "contract_amount", label: "Kontrata", sortable: true },
    { key: "deposit_amount", label: "Depozita", sortable: true },
    { key: "final_payment_due", label: "Afati", sortable: true },
    { key: "actions", label: "Veprimet", sortable: false }
  ]

  const tableData = filteredVendors.map(vendor => ({
    ...vendor,
    name: (
      <div>
        <p className="font-medium">{vendor.name}</p>
        {vendor.company && <p className="text-sm text-gray-500">{vendor.company}</p>}
      </div>
    ),
    category: (
      <div className="flex items-center gap-2">
        <span>{getCategoryIcon(vendor.category)}</span>
        <span className="capitalize">{vendor.category || 'Tjetër'}</span>
      </div>
    ),
    status: getStatusBadge(vendor.status),
    contract_amount: `€${Number(vendor.contract_amount || 0).toLocaleString()}`,
    deposit_amount: vendor.deposit_amount ? `€${Number(vendor.deposit_amount).toLocaleString()}` : '-',
    final_payment_due: vendor.final_payment_due ? new Date(vendor.final_payment_due).toLocaleDateString('sq-AL') : '-',
    actions: (
      <div className="flex items-center gap-2">
        {onEdit ? (
          <Button size="sm" variant="ghost" onClick={() => onEdit(vendor)}>
            Edit
          </Button>
        ) : (
          <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
            <Button size="sm" variant="ghost">
              Edit
            </Button>
          </Link>
        )}
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => {
            setVendorToDelete(vendor)
            setDeleteDialogOpen(true)
          }}
          className="text-red-600 hover:text-red-700"
        >
          Delete
        </Button>
      </div>
    )
  }))

  const handleRowEdit = async (vendor: any, key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ [key]: value })
        .eq("id", vendor.id)
      
      if (error) throw error
      
      toast({
        title: "Shitësi u përditësua",
        description: "Të dhënat u ruajtën me sukses"
      })
      
      router.refresh()
    } catch (error) {
      console.error("Error updating vendor:", error)
      toast({
        title: "Gabim",
        description: "Nuk u arrit të përditësohen të dhënat",
        variant: "destructive"
      })
    }
  }

  // Calculate totals
  const totalContract = vendors.reduce((sum, v) => sum + Number(v.contract_amount || 0), 0)
  const totalDeposit = vendors.reduce((sum, v) => sum + Number(v.deposit_amount || 0), 0)
  const bookedCount = vendors.filter(v => v.status === 'booked').length
  const remainingBalance = totalContract - totalDeposit

  const kpis = [
    { title: "Total Shitës", value: vendors.length.toString(), delta: null },
    { title: "Të Rezervuar", value: bookedCount.toString(), delta: { value: `${Math.round((bookedCount / vendors.length) * 100)}%`, positive: true } },
    { title: "Vlera Totale", value: `€${totalContract.toLocaleString()}`, delta: null },
    { title: "Bilanci i Mbetur", value: `€${remainingBalance.toLocaleString()}`, delta: { value: `${Math.round((totalDeposit / totalContract) * 100)}% paguar`, positive: remainingBalance <= totalContract * 0.5 } },
  ]

  const vendorColumns = [
    { 
      key: "name", 
      header: "Emri", 
      accessor: (vendor: any) => (
        <div>
          <div className="font-medium">{vendor.name}</div>
          {vendor.company && <div className="text-sm text-[color:var(--muted-2025)] dark:text-[color:var(--muted-dark)]">{vendor.company}</div>}
        </div>
      ),
      sortable: true,
      editable: false
    },
    { 
      key: "category", 
      header: "Kategoria", 
      accessor: (vendor: any) => (
        <div className="flex items-center gap-2">
          <span>{getCategoryIcon(vendor.category)}</span>
          <span className="capitalize">{vendor.category || 'Tjetër'}</span>
        </div>
      ),
      sortable: true,
      editable: false
    },
    { 
      key: "status", 
      header: "Statusi", 
      accessor: (vendor: any) => getStatusBadge(vendor.status),
      sortable: true,
      editable: false
    },
    { 
      key: "contact_person", 
      header: "Kontakti", 
      sortable: true,
      editable: true
    },
    { 
      key: "phone", 
      header: "Telefoni", 
      sortable: true,
      editable: true
    },
    { 
      key: "deposit_amount", 
      header: "Depozita", 
      accessor: (vendor: any) => vendor.deposit_amount ? `€${Number(vendor.deposit_amount).toLocaleString()}` : '-',
      sortable: true,
      editable: true,
      className: "text-right tabular-nums"
    },
    { 
      key: "contract_amount", 
      header: "Kontrata", 
      accessor: (vendor: any) => `€${Number(vendor.contract_amount || 0).toLocaleString()}`,
      sortable: true,
      editable: true,
      className: "text-right tabular-nums"
    },
    {
      key: "actions",
      header: "Veprime",
      accessor: (vendor: any) => (
        <div className="flex items-center justify-end gap-1">
          {onEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => onEdit(vendor)} className="h-7 w-7">
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edito</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                  <Button size="icon" variant="ghost" className="h-7 w-7">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Edito</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  setVendorToDelete(vendor)
                  setDeleteDialogOpen(true)
                }}
                className="h-7 w-7 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fshi</TooltipContent>
          </Tooltip>
        </div>
      ),
      editable: false,
      className: "text-right"
    }
  ] as const

  return (
    <div className="space-y-6">
      <KPIGrid items={kpis as any} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[color:var(--text-2025)] dark:text-[color:var(--text-dark)]">
          Shitësit & Kontratat
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedView === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("cards")}
            className="rounded-r-none"
          >
            Kartela
          </Button>
          <Button
            variant={selectedView === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedView("list")}
            className="rounded-l-none"
          >
            Tabelë
          </Button>
        </div>
      </div>

      {/* Vendors Display */}
      {filteredVendors.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="text-center py-12">
            <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Nuk u gjetën shitës
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Shtoni shitës për të menaxhuar ekipin e dasmës suaj
            </p>
            <Button asChild>
              <Link href="/dashboard/vendors/new">
                <Plus className="h-4 w-4 mr-2" />
                Shto Shitës
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : selectedView === "cards" ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <Card key={vendor.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>{getCategoryIcon(vendor.category)}</span>
                      {vendor.name}
                    </CardTitle>
                    {vendor.company && (
                      <p className="text-sm text-gray-600 mt-1">{vendor.company}</p>
                    )}
                  </div>
                  {vendor.rating && (
                    <div className="flex items-center">
                      {renderStars(vendor.rating)}
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  {vendor.contact_person && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{vendor.contact_person}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${vendor.phone}`} className="hover:underline">
                        {vendor.phone}
                      </a>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${vendor.email}`} className="hover:underline truncate">
                        {vendor.email}
                      </a>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Financial Info */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    {getStatusBadge(vendor.status)}
                    {isOverdue(vendor) && (
                      <Badge className="bg-red-100 text-red-800 ml-2">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Vonesa
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    {vendor.contract_amount && (
                      <p className="text-lg font-bold text-gray-900">
                        €{Number(vendor.contract_amount).toLocaleString()}
                      </p>
                    )}
                    {vendor.deposit_amount && (
                      <p className="text-xs text-gray-500">
                        Depozitë: €{Number(vendor.deposit_amount).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {vendor.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg line-clamp-2">
                    {vendor.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    {onEdit ? (
                      <Button size="sm" variant="outline" onClick={() => onEdit(vendor)}>
                        Edit
                      </Button>
                    ) : (
                      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => {
                        setVendorToDelete(vendor)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <StandardTableEnhanced
          data={filteredVendors as any}
          columns={vendorColumns as any}
          onRowEdit={handleRowEdit}
          emptyMessage="Nuk ka shitës"
        />
      )}

      {/* Footer */}
      {filteredVendors.length > 0 && (
        <Card className="bg-gradient-to-r from-gray-50 to-slate-50 border-0">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-2">
              <Store className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700 text-sm">
                Duke shfaqur <span className="font-medium">{filteredVendors.length}</span> nga{" "}
                <span className="font-medium">{vendors.length}</span> shitës
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Fshi Shitësin"
        description={`Jeni të sigurt që doni të fshini "${vendorToDelete?.name}"? Ky veprim nuk mund të zhbëhet.`}
        confirmText="Fshi"
        cancelText="Anulo"
        onConfirm={handleDelete}
        loading={deletingId === vendorToDelete?.id}
        variant="destructive"
      />
    </div>
  )
}
