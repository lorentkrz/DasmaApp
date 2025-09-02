import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Calendar, MapPin, Clock, Users } from "lucide-react"

export default async function InvitationPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  const { data: partyRows, error: partyErr } = await supabase.rpc("get_invitation_and_party", { p_token: params.token })

  if (partyErr || !partyRows || partyRows.length === 0) return notFound()

  const party = partyRows[0] as {
    is_group: boolean
    primary_first_name: string
    primary_last_name: string
    members: Array<{ id: string; first_name: string; last_name: string }>
  }

  const firstName = party.primary_first_name
  const lastName = party.primary_last_name

  async function updateRsvp(formData: FormData) {
    "use server"
    const status = formData.get("status") as "attending" | "not_attending" | "maybe" | null
    const applyAll = formData.get("apply_all") === "true"
    const attendeeIdsRaw = formData.getAll("attendee_ids") as string[]
    if (!status) redirect("/invite/thank-you")
    const supabase = await createClient()
    await supabase.rpc("set_party_response_by_token", {
      p_token: params.token,
      p_status: status,
      p_apply_all: applyAll,
      p_attendee_ids: attendeeIdsRaw.length > 0 ? attendeeIdsRaw : null,
    })
    redirect("/invite/thank-you")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-amber-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-rose-200/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-16 w-16 h-16 bg-amber-200/40 rounded-full blur-lg animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-pink-200/25 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-32 right-1/3 w-12 h-12 bg-rose-300/35 rounded-full blur-md animate-pulse delay-500"></div>
      </div>
      
      <div className="relative flex items-center justify-center px-4 py-12 min-h-screen">
        <div className="w-full max-w-3xl">
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
            {/* Elegant Header */}
            <CardHeader className="relative bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 py-12 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-200/20 via-pink-200/20 to-amber-200/20"></div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-center items-center mb-6">
                  <div className="relative">
                    <Heart className="h-16 w-16 text-rose-500 animate-pulse" fill="currentColor" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-bounce" />
                  </div>
                </div>
                <CardTitle className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Ftesa Juaj e Veçantë
                </CardTitle>
                <div className="flex items-center justify-center gap-2 text-rose-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-lg font-medium">Bashkohuni me ne në këtë ditë të bukur</span>
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-10 p-10 text-center">
              {/* Personalized Greeting */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full">
                  <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
                  <p className="text-2xl font-bold text-gray-800">
                    Të dashur {firstName} {lastName}
                  </p>
                  <Heart className="h-5 w-5 text-rose-500" fill="currentColor" />
                </div>
                <p className="text-gray-700 text-xl leading-relaxed max-w-2xl mx-auto">
                  Do të ishim të nderuar dhe të lumtur që ju të jeni pjesë e kësaj dite të veçantë dhe të paharrueshme për ne ✨
                </p>
              </div>

              {/* Wedding Details Section */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-8 space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Calendar className="h-6 w-6 text-amber-600" />
                  <h3 className="text-2xl font-bold text-gray-800">Detajet e Dasmës</h3>
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <Calendar className="h-8 w-8 text-rose-500 mx-auto" />
                    <p className="font-semibold text-gray-800">Data</p>
                    <p className="text-gray-600">E shtunë, 15 Qershor 2024</p>
                  </div>
                  <div className="space-y-2">
                    <Clock className="h-8 w-8 text-amber-500 mx-auto" />
                    <p className="font-semibold text-gray-800">Koha</p>
                    <p className="text-gray-600">17:00 - 24:00</p>
                  </div>
                  <div className="space-y-2">
                    <MapPin className="h-8 w-8 text-pink-500 mx-auto" />
                    <p className="font-semibold text-gray-800">Vendi</p>
                    <p className="text-gray-600">Salla "Elegance"</p>
                  </div>
                </div>
              </div>

              {party.is_group && (
                <div className="space-y-8">
                  {/* Group Members Section */}
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-rose-500" />
                      <p className="text-lg font-semibold text-gray-700">Kjo ftesë është për:</p>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {party.members?.map((m) => (
                        <li
                          key={m.id}
                          className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2"
                        >
                          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                          {m.first_name} {m.last_name}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick Response Buttons */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Përgjigja për të gjithë grupin
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="attending" />
                        <Button className="w-full rounded-2xl font-semibold py-6 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Heart className="h-5 w-5 mr-2" fill="currentColor" />
                          Po, vemi të gjithë!
                        </Button>
                      </form>
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="maybe" />
                        <Button variant="secondary" className="w-full rounded-2xl font-semibold py-6 text-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Clock className="h-5 w-5 mr-2" />
                          Ndoshta
                        </Button>
                      </form>
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="not_attending" />
                        <Button variant="destructive" className="w-full rounded-2xl font-semibold py-6 text-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          Na vjen keq, s'mundemi
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Individual Selection */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Ose zgjidhni individualisht</h3>
                      <p className="text-gray-600">Përzgjidhni kush do të vijë nga grupi juaj</p>
                    </div>
                    <form action={updateRsvp} className="space-y-6">
                      <div className="space-y-3">
                        {party.members?.map((m) => (
                          <label key={m.id} className="flex items-center gap-3 text-gray-700 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-200/50 hover:bg-white/90 transition-all cursor-pointer">
                            <input type="checkbox" name="attendee_ids" value={m.id} className="w-5 h-5 accent-rose-500 rounded" />
                            <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
                            <span className="font-medium">{m.first_name} {m.last_name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <input type="hidden" name="apply_all" value="false" />
                        <Button name="status" value="attending" className="w-full rounded-2xl font-semibold py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Heart className="h-4 w-4 mr-2" fill="currentColor" />
                          Konfirmo
                        </Button>
                        <Button name="status" value="maybe" variant="secondary" className="w-full rounded-2xl font-semibold py-4 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Clock className="h-4 w-4 mr-2" />
                          Ndoshta
                        </Button>
                        <Button name="status" value="not_attending" variant="destructive" className="w-full rounded-2xl font-semibold py-4 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          Na vjen keq
                        </Button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {!party.is_group && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                    A do të merrni pjesë?
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="attending" />
                      <Button className="w-full rounded-2xl font-bold py-8 text-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-xl transform hover:scale-105 transition-all duration-300">
                        <Heart className="h-6 w-6 mr-3" fill="currentColor" />
                        Po, do të vij!
                      </Button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="maybe" />
                      <Button variant="secondary" className="w-full rounded-2xl font-bold py-8 text-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                        <Clock className="h-6 w-6 mr-3" />
                        Ndoshta
                      </Button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="not_attending" />
                      <Button variant="destructive" className="w-full rounded-2xl font-bold py-8 text-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-xl transform hover:scale-105 transition-all duration-300">
                        Na vjen keq, s'mund
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Footer Message */}
              <div className="pt-8 border-t border-rose-200/50">
                <p className="text-gray-600 text-lg italic">
                  "Dashuria është e vetmja forcë që mund ta transformojë një armik në mik" ❤️
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Faleminderit që do të jeni pjesë e kësaj dite të veçantë!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}