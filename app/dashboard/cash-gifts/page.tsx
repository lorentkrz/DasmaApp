"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CashGiftsTracker } from "@/components/cash-gifts-tracker-fixed"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gift, Sparkles, Heart, TrendingUp } from "lucide-react"

interface Wedding {
  id: string
  bride_name: string
  groom_name: string
}

export default function CashGiftsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentWedding, setCurrentWedding] = useState<Wedding | null>(null)
  const [guests, setGuests] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error || !user) {
        router.push("/auth/login")
        return
      }

      const { data: weddings } = await supabase
        .from("weddings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)

      if (!weddings || weddings.length === 0) {
        router.push("/dashboard/weddings/new")
        return
      }

      const wedding = weddings[0]
      setCurrentWedding(wedding)

      const { data: guestsData } = await supabase
        .from("guests")
        .select("*")
        .eq("wedding_id", wedding.id)
        .order("last_name")

      setGuests(guestsData || [])
      setLoading(false)
    }

    loadData()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <Gift className="h-12 w-12 text-emerald-500 mx-auto mb-4 animate-bounce" />
          <p className="text-lg font-medium text-gray-700">Duke ngarkuar dhurata...</p>
        </div>
      </div>
    )
  }

  if (!currentWedding) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-200/30 to-green-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full flex items-center justify-center shadow-lg">
              <Gift className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-clip-text text-transparent">
              Dhurata në Para
            </h1>
            <Sparkles className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
            <p className="text-gray-700 font-medium text-lg">
              Menaxhoni bakshishin dhe dhurata në para për dasmën e {currentWedding.bride_name} & {currentWedding.groom_name}
            </p>
          </div>
        </div>

        <CashGiftsTracker weddingId={currentWedding.id} guests={guests} />
      </div>
    </div>
  )
}
