"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { StandardDropdown } from "@/components/ui/standard-dropdown"
import { StandardTable } from "@/components/ui/standard-table"
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
import { useRouter } from "next/navigation"

interface VendorListProps {
  vendors: any[]
  onEdit?: (vendor: any) => void
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

export function VendorListRefactored({ vendors, onEdit }: VendorListProps) {
  const [searchTerm, setSearchTerm] = useState("")
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
    const statusConfig = {
      considering: { label: "Duke menduar", className: "bg-gray-100 text-gray-800" },
      contacted: { label: "Kontaktuar", className: "bg-blue-100 text-blue-800" },
      booked: { label: "Rezervuar", className: "bg-green-100 text-green-800" },
      cancelled: { label: "Anulluar", className: "bg-red-100 text-red-800" }
    }
    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getCategoryIcon = (category: string) => {
    const icons = {
      photography: "📸",
      music: "🎵",
      flowers: "🌺",
      catering: "🍽️",
      attire: "👗",
      other: "🎉"
    }
    return icons[category] || "📦"
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
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
            <Button size="sm" variant="ghost">
              <Edit className="h-4 w-4" />
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
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    )
  }))

  // Calculate totals
  const totalContract = vendors.reduce((sum, v) => sum + Number(v.contract_amount || 0), 0)
  const totalDeposit = vendors.reduce((sum, v) => sum + Number(v.deposit_amount || 0), 0)
  const bookedCount = vendors.filter(v => v.status === 'booked').length

  return (
    <div className="space-y-6">
      {/* Motivational Quote */}
      <Card className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 border-0">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/80 rounded-full flex items-center justify-center shadow-lg">
              <Heart className="h-6 w-6 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-medium text-gray-800 italic">
                "Ekipi i përsosur krijon dasmën e përsosur"
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Zgjidhni shitësit më të mirë për ditën tuaj të veçantë
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Store className="h-5 w-5 text-white" />
              </div>
              <Sparkles className="h-4 w-4 text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Total Shitës</p>
            <p className="text-2xl font-bold text-gray-900">{vendors.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <Building className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Të Rezervuar</p>
            <p className="text-2xl font-bold text-gray-900">{bookedCount}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Vlera Totale</p>
            <p className="text-2xl font-bold text-gray-900">€{totalContract.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-0 shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-1">Depozita Paguar</p>
            <p className="text-2xl font-bold text-gray-900">€{totalDeposit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">Filtro Shitësit</CardTitle>
              <CardDescription>Gjeni shpejt shitësit që kërkoni</CardDescription>
            </div>
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
                Listë
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Kërko sipas emrit, kompanisë ose kontaktit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <StandardDropdown
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              options={statusOptions}
              placeholder="Statusi"
              className="w-full"
            />
            <StandardDropdown
              value={selectedCategory}
              onValueChange={setSelectedCategory}
              options={categoryOptions}
              placeholder="Kategoria"
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

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
                        <Edit className="h-4 w-4 mr-1" />
                        Edito
                      </Button>
                    ) : (
                      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4 mr-1" />
                          Edito
                        </Button>
                      </Link>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setVendorToDelete(vendor)
                        setDeleteDialogOpen(true)
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {vendor.final_payment_due && (
                    <span className="text-xs text-gray-600">
                      Afati: {new Date(vendor.final_payment_due).toLocaleDateString('sq-AL')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-0">
            <StandardTable
              columns={columns}
              data={tableData}
              pageSize={10}
            />
          </CardContent>
        </Card>
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
        isLoading={deletingId === vendorToDelete?.id}
        variant="destructive"
      />
    </div>
  )
}
