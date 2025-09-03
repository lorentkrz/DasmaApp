import { Heart, Sparkles, CheckCircle, Calendar, Users, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from "next/navigation"
import Link from "next/link"

export default async function InviteThankYouPage({ 
  searchParams 
}: { 
  searchParams: { status?: string; token?: string } 
}) {
  const { status, token } = searchParams
  
  let guestInfo = null
  let weddingInfo = null
  
  if (token) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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
    
    // Use the existing RPC function to get current status
    console.log('Thank you page - fetching data for token:', token)
    
    const { data: guestData, error: guestError } = await supabase.rpc('get_invitation_and_guest', {
      p_token: token
    })
    
    console.log('Guest data from RPC:', guestData, 'Error:', guestError)
    
    if (guestData && guestData.length > 0) {
      const guestRecord = guestData[0]
      
      // Get full guest details
      const { data: fullGuest, error: guestFetchError } = await supabase
        .from("guests")
        .select("*")
        .eq("id", guestRecord.guest_id)
        .single()
      
      console.log('Full guest data:', fullGuest, 'Error:', guestFetchError)
      
      // Get wedding details
      const { data: wedding, error: weddingFetchError } = await supabase
        .from("weddings")
        .select("*")
        .eq("id", guestRecord.wedding_id)
        .single()
      
      console.log('Wedding data:', wedding, 'Error:', weddingFetchError)
      
      guestInfo = fullGuest
      weddingInfo = wedding
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
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 left-16 w-24 h-24 bg-rose-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-20 h-20 bg-amber-200/40 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-24 left-1/3 w-28 h-28 bg-pink-200/25 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-rose-300/35 rounded-full blur-md animate-pulse delay-500"></div>
      </div>
      
      <div className="relative flex items-center justify-center p-6 min-h-screen">
        <div className="max-w-2xl w-full">
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
            <CardContent className="p-8 md:p-12 text-center space-y-8">
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
                <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Faleminderit shumë!
                </h1>
                
                <div className="space-y-4">
                  <p className="text-xl md:text-2xl font-semibold text-gray-800">
                    Përgjigja juaj u regjistrua me sukses ✨
                  </p>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-xl mx-auto">
                    Jemi të lumtur që morët kohën për t'u përgjigjur. Presim me padurim të shohemi në këtë ditë të veçantë!
                  </p>
                </div>
              </div>

              {/* RSVP Status Confirmation */}
              {guestInfo && weddingInfo && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                    <h3 className="text-lg md:text-xl font-bold text-gray-800">Konfirmimi i Përgjigjes</h3>
                    <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 md:p-6">
                      <p className="text-gray-700 mb-2">
                        <strong>{guestInfo.first_name} {guestInfo.last_name}</strong>
                      </p>
                      <p className="text-sm text-gray-600 mb-3">
                        Dasma e {weddingInfo.bride_name} & {weddingInfo.groom_name}
                      </p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-semibold bg-gradient-to-r ${getStatusColor(guestInfo.rsvp_status)}`}>
                        <CheckCircle className="h-4 w-4" />
                        {getStatusText(guestInfo.rsvp_status)}
                      </div>
                    </div>
                    
                    {guestInfo.rsvp_responded_at && (
                      <p className="text-sm text-gray-600">
                        Regjistruar më: {new Date(guestInfo.rsvp_responded_at).toLocaleDateString('sq-AL', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
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
                      <p className="text-gray-600 text-sm">{weddingInfo.ceremony_time || '17:00'}</p>
                    </div>
                    <div className="bg-white/50 rounded-xl p-4">
                      <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
                      <p className="font-semibold text-gray-800 text-sm">Vendi</p>
                      <p className="text-gray-600 text-sm break-words">{weddingInfo.venue || 'Salla "Elegance"'}</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
