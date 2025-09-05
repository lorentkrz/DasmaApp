import { Heart, Sparkles, CheckCircle, Calendar, Users, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
            
              {/* Success Icon */}
              <div className="flex justify-center items-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center animate-pulse">
                    <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-white" fill="currentColor" />
                  </div>
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 md:h-8 md:w-8 text-amber-400 animate-bounce" />
                  <Heart className="absolute -bottom-1 -left-1 h-5 w-5 md:h-6 md:w-6 text-rose-500 animate-pulse" fill="currentColor" />
                </div>
              </div>

              {/* Thank You Message */}
              <div className="space-y-6">
                <h1 className={`${dancingScript.className} text-4xl md:text-5xl font-medium text-stone-700`}>
                  Faleminderit shumë!
                </h1>
                
                <div className="space-y-4">
                  <p className={`${cormorant.className} text-xl md:text-2xl font-semibold text-stone-800`}>
                    Përgjigja juaj u regjistrua me sukses ✨
                  </p>
                  <p className={`${cormorant.className} text-lg md:text-xl text-stone-600 leading-relaxed max-w-xl mx-auto`}>
                    Jemi të lumtur që morët kohën për t'u përgjigjur. Presim me padurim të shohemi në këtë ditë të veçantë!
                  </p>
                </div>
              </div>

              {/* RSVP Status Confirmation for specific guests */}
              {updatedGuests.length > 0 && weddingInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">Konfirmimi i Përgjigjes</h3>
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  
                  <div className="space-y-4">
                    {updatedGuests.map((g) => (
                      <div key={g.id} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6 text-left">
                        <p className="text-gray-700 mb-2">
                          <strong>{g.first_name} {g.last_name}</strong>
                        </p>
                        <p className={`${cormorant.className} text-sm text-stone-600 mb-3`}>
                          Dasma e {weddingInfo.groom_name} & {weddingInfo.bride_name}
                        </p>
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r ${getStatusColor(g.rsvp_status)}`}>
                          <CheckCircle className="h-4 w-4" />
                          {getStatusText(g.rsvp_status)}
                        </div>
                        {g.rsvp_responded_at && (
                          <p className="text-sm text-gray-600 mt-2">
                            Regjistruar më: {new Date(g.rsvp_responded_at).toLocaleDateString('sq-AL', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wedding Details Reminder */}
              {weddingInfo && (
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 md:p-8 space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">Detajet e Dasmës</h3>
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 text-rose-600" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-white/50 rounded-xl p-4">
                      <Calendar className="h-6 w-6 text-rose-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-800 text-sm">Data</p>
                      <p className="text-gray-600 text-sm">{new Date(weddingInfo.wedding_date).toLocaleDateString('sq-AL', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <Clock className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-800 text-sm">Koha</p>
                      <p className="text-gray-600 text-sm">19:00 - 20:00</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-800 text-sm">Vendi</p>
                      <p className="text-gray-600 text-sm break-words">{weddingInfo.venue_name || 'Venue TBA'}</p>
                      {weddingInfo.venue_address && (
                        <p className="text-gray-500 text-xs mt-1">{weddingInfo.venue_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Change Response Option */}
              {token && (
                <div className="pt-6 border-t border-rose-200/50">
                  <p className="text-gray-600 text-base mb-4">
                    Dëshironi të ndryshoni përgjigjen?
                  </p>
                  <Link href={`/invite/${token}`}>
                    <Button variant="outline" className="rounded-2xl px-6 py-3 font-semibold border-2 border-rose-300 text-rose-600 hover:bg-rose-50">
                      Ndrysho Përgjigjen
                    </Button>
                  </Link>
                </div>
              )}

              {/* Decorative Quote */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-6 md:p-8 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  <Heart className="h-6 w-6 text-rose-500" fill="currentColor" />
                </div>
                <p className="text-base md:text-lg italic text-gray-700 font-medium">
                  "Dashuria është gjuha që zemra e kupton pa fjalë"
                </p>
                <p className="text-base md:text-lg text-gray-700">
                  Faleminderit që morët pjesë në dasmën tonë të veçantë!
                </p>
              </div>

              {/* Additional Message */}
              <div className="pt-6 border-t border-rose-200/50">
                <p className="text-gray-600 text-base md:text-lg">
                  Nëse keni ndonjë pyetje, mos hezitoni të na kontaktoni.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Me dashuri dhe mirënjohje të thellë
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
