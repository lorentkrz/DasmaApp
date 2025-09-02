import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VendorListWrapper } from "@/components/vendor-list-wrapper"
import { VendorAddButton } from "@/components/vendor-add-button"
import { Heart, Sparkles, Store } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VendorsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get current wedding (RLS-safe: rely on policies and pick most recent)
  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)

  const wedding = weddings?.[0]

  if (!wedding) redirect("/dashboard/weddings/new")

  // Get vendors
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-rose-200/30 to-pink-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-amber-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-pink-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-8 px-4 md:px-6 pt-6 relative z-10">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg">
                <Store className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 bg-clip-text text-transparent">
                Shitësit & Kontratat
              </h1>
              <Sparkles className="h-8 w-8 text-amber-400 animate-bounce" />
            </div>
            <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
              <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
              <p className="text-gray-700 font-medium text-lg">
                Menaxhoni shitësit dhe kontratat për dasmën tuaj të përsosur
              </p>
              <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
            </div>
          </div>
          <div className="mt-6 md:mt-0">
            <VendorAddButton wedding={wedding} />
          </div>
        </div>

        <VendorListWrapper wedding={wedding} vendors={vendors || []} />
      </div>
    </div>
  )
}
