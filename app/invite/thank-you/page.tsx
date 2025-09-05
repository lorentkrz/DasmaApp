import { Heart, Sparkles, CheckCircle, Calendar, Users, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound } from "next/navigation"
import Link from "next/link"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

export default async function InviteThankYouPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; token?: string; updated?: string }>
}) {
  const { status, token, updated } = await searchParams

  let weddingInfo: any = null
  let updatedGuests: any[] = []

  if (token) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const useService = !!serviceKey
    const cookieStore = await cookies()
    const supabaseAnon = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const supabase = useService
      ? createSupabaseServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey!)
      : supabaseAnon

    // Load invitation to know the wedding and to resolve grouping
    const { data: inv } = await supabase
      .from('invitations')
      .select('id, wedding_id, guest_id, group_id')
      .eq('token', token)
      .single()
    if (!inv) return notFound()

    // Load wedding
    const { data: wedding } = await supabase
      .from('weddings')
      .select('*')
      .eq('id', inv.wedding_id)
      .single()
    weddingInfo = wedding

    // Determine which guests to display
    let ids: string[] = []
    if (updated === 'ALL') {
      // Resolve primary guest id
      let primaryId: string | null = inv.guest_id
      if (!primaryId && inv.group_id) {
        const { data: gg } = await supabase
          .from('guest_groups')
          .select('primary_guest_id')
          .eq('id', inv.group_id)
          .single()
        primaryId = gg?.primary_guest_id || null
      }
      if (primaryId) {
        const coll: string[] = [primaryId]
        const { data: members } = await supabase
          .from('guests')
          .select('id')
          .eq('group_id', primaryId)
        for (const m of members || []) {
          if (m.id && !coll.includes(m.id)) coll.push(m.id)
        }
        ids = coll
      }
    } else if (updated) {
      ids = updated.split(',').filter((v) => /[0-9a-fA-F-]{36}/.test(v))
    } else if (inv.guest_id) {
      ids = [inv.guest_id]
    }

    if (ids.length > 0) {
      const { data: guests } = await supabase
        .from('guests')
        .select('*')
        .in('id', ids)
      updatedGuests = guests || []
    }
  }
  
  const getStatusText = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'attending': return 'Po, do të vijmë!'
      case 'not_attending': return 'Na vjen keq, s\'mundemi'
      case 'maybe': return 'Ndoshta'
      default: return 'Në pritje'
    }
  }
  
  const getStatusColor = (rsvpStatus: string) => {
    switch (rsvpStatus) {
      case 'attending': return 'from-green-500 to-emerald-500'
      case 'not_attending': return 'from-rose-500 to-pink-500'
      case 'maybe': return 'from-amber-400 to-yellow-400'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-rose-50 to-amber-50 relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23d6d3d1%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%227%22%20cy%3D%227%22%20r%3D%221%22/%3E%3Ccircle%20cx%3D%2253%22%20cy%3D%2253%22%20r%3D%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
      </div>
      
      {/* Floating floral elements */}
      <div className="absolute top-8 left-8 w-16 h-16 opacity-20 animate-pulse">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <circle cx="32" cy="16" r="4" fill="#E8B4CB"/>
          <circle cx="24" cy="24" r="3" fill="#F5E6A3"/>
          <circle cx="40" cy="28" r="2" fill="#C8A2C8"/>
          <path d="M20 40 Q32 35 44 40 Q40 50 32 48 Q24 50 20 40" fill="#A8B5A0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="absolute top-16 right-12 w-12 h-12 opacity-15 animate-pulse" style={{animationDelay: '1s'}}>
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle cx="24" cy="12" r="3" fill="#F0E68C"/>
          <circle cx="16" cy="20" r="2" fill="#E8B4CB"/>
          <circle cx="32" cy="24" r="2.5" fill="#C8A2C8"/>
          <path d="M12 32 Q24 28 36 32 Q32 40 24 38 Q16 40 12 32" fill="#B8C5B0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-stone-200/30 overflow-hidden">
          <div className="relative p-8 pb-6 text-center bg-gradient-to-b from-stone-50/50 to-white">
            
            {/* Heart Symbol */}
            <div className="mb-6">
              <div className="text-5xl text-black">
                ♥
              </div>
            </div>
            

              {/* Thank You Message */}
              <div className="mb-8 md:mb-12">
                <h1 className={`${dancingScript.className} text-3xl md:text-4xl lg:text-5xl font-medium text-stone-700 mb-4 md:mb-8`}>
                  Faleminderit për përgjigjen tuaj!
                </h1>
                
                {/* RSVP Status Confirmation */}
                {updatedGuests.length > 0 && weddingInfo && (
                  <div className="mb-6 md:mb-10">
                    {updatedGuests.map((g) => (
                      <div key={g.id} className="relative">
                        <div className="bg-white/80 backdrop-blur-sm border-2 border-stone-200/50 rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-lg">
                          <div className="text-center">
                            <p className="text-base md:text-lg text-gray-600 mb-2 md:mb-3">Ju keni konfirmuar:</p>
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-white font-extrabold text-base md:text-lg shadow-md ${
                              getStatusText(g.rsvp_status) === 'Po, do të vijmë!' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                                : getStatusText(g.rsvp_status) === 'Na vjen keq, s\'mundemi' 
                                ? 'bg-gradient-to-r from-rose-500 to-pink-500' 
                                : 'bg-gradient-to-r from-amber-400 to-yellow-400'
                            }`}>
                              <span className="text-lg md:text-xl">
                                {getStatusText(g.rsvp_status) === 'Po, do të vijmë!' ? '✅' : getStatusText(g.rsvp_status) === 'Na vjen keq, s\'mundemi' ? '❌' : '❔'}
                              </span>
                              <span>
                                {getStatusText(g.rsvp_status) === 'Po, do të vijmë!' ? 'Po' : getStatusText(g.rsvp_status) === 'Na vjen keq, s\'mundemi' ? 'Jo' : 'Ndoshta'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Wedding Details - Mobile Optimized */}
                {weddingInfo && (
                  <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl md:rounded-2xl p-4 md:p-8 mb-6 md:mb-10">
                    <div className="space-y-2 md:space-y-4">
                      <div className="flex items-center justify-center gap-2 md:gap-3">
                        <Calendar className="h-4 w-4 md:h-5 md:w-5 text-rose-600 flex-shrink-0" />
                        <p className="text-base md:text-xl font-medium text-gray-800 text-center">
                          {new Date(weddingInfo.wedding_date).toLocaleDateString('sq-AL', { 
                            day: 'numeric',
                            month: 'long', 
                            year: 'numeric' 
                          })}, 19:00
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 md:gap-3">
                        <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-600 flex-shrink-0" />
                        <p className="text-base md:text-xl font-medium text-gray-800 text-center break-words">
                          {weddingInfo.venue_name || 'Vendi do të njoftohet'}{weddingInfo.venue_address ? `, ${weddingInfo.venue_address}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Change Response Option */}
              {token && (
                <div className="mb-6 md:mb-8">
                  <p className="text-gray-600 text-base md:text-lg mb-4 md:mb-6 text-center px-4">
                    Nëse dëshironi të ndryshoni përgjigjen tuaj, klikoni këtu
                  </p>
                  <div className="flex justify-center">
                    <Link href={`/invite/${token}`}>
                      <Button variant="outline" className="rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 text-base md:text-lg font-semibold border-2 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 transition-all duration-200">
                        Ndrysho
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 md:pt-8 border-t border-rose-200/50 text-center">
                <p className="text-lg md:text-2xl font-medium text-gray-700 mb-1 md:mb-2">
                  Me dashuri,
                </p>
                <p className={`${dancingScript.className} text-2xl md:text-3xl font-medium text-stone-700`}>
                  {weddingInfo?.groom_name} & {weddingInfo?.bride_name} ❤️
                </p>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}
