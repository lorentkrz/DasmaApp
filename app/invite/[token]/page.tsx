import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Calendar, MapPin, Clock, Users } from "lucide-react"

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  // Create public Supabase client without authentication
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
  
  // Get invitation details first
  const { data: invitation, error: inviteErr } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single()

  if (inviteErr || !invitation) return notFound()

  // Get wedding details; if anon is blocked by RLS, fall back to service role
  let weddingData = null as any
  {
    const { data } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", invitation.wedding_id)
      .single()
    weddingData = data
    if (!weddingData && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: sData } = await service
        .from("weddings")
        .select("*")
        .eq("id", invitation.wedding_id)
        .single()
      weddingData = sData
    }
  }

  // Get guest details separately (handle both individual and group invitations)
  let guestData = null as any
  const tryFetchGuestById = async (guestId: string) => {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .single()
    if (data) return data
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: sData } = await service
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single()
      return sData
    }
    return null
  }
  if (invitation.guest_id) {
    guestData = await tryFetchGuestById(invitation.guest_id)
  } else if (invitation.group_id) {
    // For group invitations, get the primary guest
    let groupData: { primary_guest_id: string } | null = null
    {
      const { data } = await supabase
        .from("guest_groups")
        .select("primary_guest_id")
        .eq("id", invitation.group_id)
        .single()
      groupData = data
      if (!groupData && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const service = createSupabaseServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const { data: sData } = await service
          .from("guest_groups")
          .select("primary_guest_id")
          .eq("id", invitation.group_id)
          .single()
        groupData = sData
      }
    }
    if (groupData?.primary_guest_id) {
      guestData = await tryFetchGuestById(groupData.primary_guest_id)
    }
  }

  if (!weddingData || !guestData) return notFound()

  const wedding = weddingData
  const guest = guestData
  
  // Check if this is a group invitation (guest_groups schema)
  const effectiveGroupId = invitation.group_id || guest.group_id
  let groupMembers: any[] | null = null
  if (effectiveGroupId) {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("group_id", effectiveGroupId)
      .neq("id", guest.id)
    groupMembers = data || null
    if ((!groupMembers || groupMembers.length === 0) && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
      const { data: sData } = await service
        .from("guests")
        .select("*")
        .eq("group_id", effectiveGroupId)
        .neq("id", guest.id)
      groupMembers = sData || null
    }
  }

  const isGroup = (groupMembers && groupMembers.length > 0) || guest.plus_one
  const firstName = guest.first_name
  const lastName = guest.last_name

  async function updateRsvp(formData: FormData) {
    "use server"
    const status = formData.get("status") as "attending" | "not_attending" | "maybe" | null
    const applyAll = formData.get("apply_all") === "true"
    const attendeeIdsRaw = formData.getAll("attendee_ids") as string[]
    let targetGuestId: string | null = null
    try {
      if (!status) {
        throw new Error('Missing RSVP status in submission')
      }
      console.log('Submitting RSVP:', {
        status,
        applyAll,
        attendeeIds: attendeeIdsRaw,
        token: token
      })

      // First, try the SECURITY DEFINER RPC so it works even without service role key
      try {
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
        // Prepare attendee UUIDs (strip plus_one markers and validate)
        const uuidLike = (v: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)
        const attendeeUuids = (attendeeIdsRaw || [])
          .filter((v) => !v.endsWith('_plus_one'))
          .filter((v) => uuidLike(v))
        const { data: rpcData, error: rpcError } = await supabaseAnon.rpc('update_rsvp_by_token', {
          p_token: token,
          p_status: status,
          p_apply_all: applyAll,
          p_attendee_ids: attendeeUuids.length > 0 ? attendeeUuids : null,
        })
        if (!rpcError && rpcData && rpcData.length > 0) {
          const updatedParam = encodeURIComponent(
            (rpcData as { updated_id: string }[])
              .map((r) => r.updated_id)
              .filter(Boolean)
              .filter((v, i, arr) => arr.indexOf(v) === i)
              .join(',')
          )
          return redirect(`/invite/thank-you?status=${status}&token=${token}&updated=${updatedParam}`)
        }
        if (rpcError) {
          console.warn('RPC update_rsvp_by_token failed, will fall back to service role path:', rpcError)
        } else {
          console.warn('RPC update_rsvp_by_token returned no rows, falling back to service role path')
        }
      } catch (rpcCatchErr) {
        console.warn('RPC attempt threw, will fall back to service role path:', rpcCatchErr)
      }

      // Use service role server-side to bypass RLS safely
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (!serviceKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY on server')
      }
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
      )

      // Resolve invitation by token
      const { data: inv, error: invErr } = await service
        .from('invitations')
        .select('id, token, guest_id, group_id, wedding_id')
        .eq('token', token)
        .single()
      if (invErr || !inv) {
        throw new Error(`Invalid invitation token`)
      }

      // Resolve target guest: prefer invitation.guest_id, else group's primary guest
      targetGuestId = inv.guest_id as string | null
      if (!targetGuestId && inv.group_id) {
        const { data: gg, error: ggErr } = await service
          .from('guest_groups')
          .select('primary_guest_id')
          .eq('id', inv.group_id)
          .single()
        if (ggErr) throw ggErr
        targetGuestId = gg?.primary_guest_id || null
      }
      if (!targetGuestId) {
        throw new Error('No guest resolved for this invitation')
      }

      // Collect group member IDs (including primary guest) accommodating both schemas:
      // A) members have group_id = primary_guest_id
      // B) members have group_id = invitations.group_id (a shared group UUID)
      const groupIds: string[] = [targetGuestId]
      let groupRowsA: { id: string }[] | null = null
      let groupRowsB: { id: string }[] | null = null
      // Try schema A: group_id equals primary guest id
      const { data: aRows, error: aErr } = await service
        .from('guests')
        .select('id')
        .eq('group_id', targetGuestId)
      if (aErr) throw aErr
      groupRowsA = aRows || []
      // Try schema B: group_id equals invitations.group_id
      if (inv.group_id) {
        const { data: bRows, error: bErr } = await service
          .from('guests')
          .select('id')
          .eq('group_id', inv.group_id)
        if (bErr) throw bErr
        groupRowsB = bRows || []
      }
      for (const r of [...(groupRowsA || []), ...(groupRowsB || [])]) {
        if (r.id && !groupIds.includes(r.id)) groupIds.push(r.id)
      }

      // Utility: stricter UUID pattern
      const uuidLike = (v: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v)

      // Determine which IDs to update
      let idsToUpdate: string[] = []
      if (applyAll) {
        idsToUpdate = groupIds
      } else if (attendeeIdsRaw && attendeeIdsRaw.length > 0) {
        idsToUpdate = attendeeIdsRaw
          .filter((v) => !v.endsWith('_plus_one')) // ignore plus-one marker without dedicated row
          .map((v) => v) // keep as-is
          .filter((v) => uuidLike(v))
          .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
          .filter((v) => groupIds.includes(v)) // ensure only members from this invitation (either schema)
      } else {
        // No selections provided; default to updating only the primary guest
        idsToUpdate = [targetGuestId]
      }

      if (idsToUpdate.length > 0) {
        const { data: updatedRows, error: updErr } = await service
          .from('guests')
          .update({
            rsvp_status: status,
            rsvp_responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in('id', idsToUpdate)
          .select('id')
        if (updErr) throw updErr
        if (!updatedRows || updatedRows.length === 0) {
          console.error('RSVP update affected 0 rows', { idsToUpdate, status, token, targetGuestId, groupIds })
          throw new Error('RSVP update did not affect any rows')
        }
      }

      // Update invitation timestamps
      const { error: invUpdErr } = await service
        .from('invitations')
        .update({
          responded_at: new Date().toISOString(),
          opened_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('token', token)
      if (invUpdErr) throw invUpdErr
      
      // Note: Plus-one without a dedicated guest row is ignored in per-person updates.
      // If you want separate RSVP for plus-one, we should model plus-one as a guest row in the same group.
      
    } catch (error) {
      console.error('RSVP update error:', error)
      // Still redirect even on error to show thank you page
    }
    
    // Always redirect immediately - include which IDs were updated for display
    const updatedParam = encodeURIComponent((attendeeIdsRaw && attendeeIdsRaw.length > 0) ? (
      attendeeIdsRaw
        .filter((v) => !v.endsWith('_plus_one'))
        .filter((v) => /[0-9a-fA-F-]{36}/.test(v))
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(',')
    ) : (applyAll ? 'ALL' : (targetGuestId || '')))

    redirect(`/invite/thank-you?status=${status}&token=${token}&updated=${updatedParam}`)
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
      
      <div className="relative z-10 container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header - Mobile Responsive */}
          <div className="text-center mb-6 md:mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-rose-500" fill="currentColor" />
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" fill="currentColor" />
              <Heart className="h-6 w-6 md:h-8 md:w-8 text-rose-500" fill="currentColor" />
            </div>
            <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
              Ju jeni të ftuar!
            </h1>
            <p className="text-base md:text-lg text-gray-600 font-medium px-4">
              në dasmën e {wedding.bride_name} & {wedding.groom_name}
            </p>
          </div>

          <Card className="rounded-2xl sm:rounded-3xl shadow-2xl border-0 overflow-hidden backdrop-blur-sm bg-white/95">
            {/* Elegant Header - Mobile Responsive */}
            <CardHeader className="relative bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 py-8 md:py-12 text-center overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-200/20 via-pink-200/20 to-amber-200/20"></div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-center items-center mb-4 md:mb-6">
                  <div className="relative">
                    <Heart className="h-12 w-12 md:h-16 md:w-16 text-rose-500 animate-pulse" fill="currentColor" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-amber-400 animate-bounce" />
                  </div>
                </div>
                <CardTitle className="text-3xl md:text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent">
                  Ftesa Juaj e Veçantë
                </CardTitle>
                <div className="flex items-center justify-center gap-2 text-rose-600">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-base md:text-lg font-medium px-2">Bashkohuni me ne në këtë ditë të bukur</span>
                  <Sparkles className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 md:space-y-10 p-6 md:p-10 text-center">
              {/* Personalized Greeting - Mobile Responsive */}
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full">
                  <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-500" fill="currentColor" />
                  <p className="text-lg md:text-2xl font-bold text-gray-800">
                    Të dashur {firstName} {lastName}
                  </p>
                  <Heart className="h-4 w-4 md:h-5 md:w-5 text-rose-500" fill="currentColor" />
                </div>
                <p className="text-gray-700 text-base md:text-xl leading-relaxed max-w-2xl mx-auto px-4">
                  Do të ishim të nderuar dhe të lumtur që ju të jeni pjesë e kësaj dite të veçantë dhe të paharrueshme për ne ✨
                </p>
              </div>

              {/* Wedding Details Section - Mobile Optimized */}
              <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl p-4 md:p-8 space-y-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800">Detajet e Dasmës</h3>
                  <Calendar className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <div className="text-center mb-6">
                  <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 bg-clip-text text-transparent mb-2 leading-tight">
                    {wedding.bride_name} & {wedding.groom_name}
                  </h2>
                  <p className="text-gray-600 text-base sm:text-lg">ju ftojnë në dasmën e tyre</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 text-center">
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <Calendar className="h-6 w-6 md:h-8 md:w-8 text-rose-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Data</p>
                    <p className="text-gray-600 text-sm md:text-base">{new Date(wedding.wedding_date).toLocaleDateString('sq-AL', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <Clock className="h-6 w-6 md:h-8 md:w-8 text-amber-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Koha</p>
                    <p className="text-gray-600 text-sm md:text-base">{wedding.ceremony_time || '17:00'}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-white/50 rounded-xl">
                    <MapPin className="h-6 w-6 md:h-8 md:w-8 text-pink-500 mx-auto" />
                    <p className="font-semibold text-gray-800 text-sm md:text-base">Vendi</p>
                    <p className="text-gray-600 text-sm md:text-base break-words">{wedding.venue || 'Salla "Elegance"'}</p>
                  </div>
                </div>
              </div>

              {isGroup && (
                <div className="space-y-6 md:space-y-8">
                  {/* Group Members Section - Mobile Responsive */}
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-4 md:p-6">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Users className="h-5 w-5 text-rose-500" />
                      <p className="text-base md:text-lg font-semibold text-gray-700">Kjo ftesë është për:</p>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <li className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2">
                        <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                        {guest.first_name} {guest.last_name}
                      </li>
                      {guest.plus_one && (
                        <li className="bg-white/80 backdrop-blur-sm border border-rose-200/50 rounded-xl px-4 py-3 shadow-sm text-gray-700 font-medium text-sm flex items-center gap-2">
                          <Heart className="h-3 w-3 text-rose-400" fill="currentColor" />
                          {guest.plus_one_name || 'Shoqëruesi/ja'}
                        </li>
                      )}
                      {groupMembers?.map((m) => (
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

                  {/* Quick Response Buttons - Mobile Responsive */}
                  <div className="space-y-4">
                    <h3 className="text-lg md:text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Përgjigja për të gjithë grupin
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="attending" />
                        <Button className="w-full rounded-2xl font-semibold py-4 md:py-6 text-base md:text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Heart className="h-4 w-4 md:h-5 md:w-5 mr-2" fill="currentColor" />
                          Po, vemi të gjithë!
                        </Button>
                      </form>
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="maybe" />
                        <Button variant="secondary" className="w-full rounded-2xl font-semibold py-4 md:py-6 text-base md:text-lg bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white shadow-lg transform hover:scale-105 transition-all duration-200">
                          <Clock className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                          Ndoshta
                        </Button>
                      </form>
                      <form action={updateRsvp}>
                        <input type="hidden" name="apply_all" value="true" />
                        <input type="hidden" name="status" value="not_attending" />
                        <Button variant="destructive" className="w-full rounded-2xl font-semibold py-4 md:py-6 text-base md:text-lg bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-lg transform hover:scale-105 transition-all duration-200">
                          Na vjen keq, s'mundemi
                        </Button>
                      </form>
                    </div>
                  </div>

                  {/* Individual Selection - Mobile Responsive */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Ose zgjidhni individualisht</h3>
                      <p className="text-gray-600">Përzgjidhni kush do të vijë nga grupi juaj</p>
                    </div>
                    <form action={updateRsvp} className="space-y-6">
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 text-gray-700 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-200/50 hover:bg-white/90 transition-all cursor-pointer">
                          <input type="checkbox" name="attendee_ids" value={guest.id} className="w-5 h-5 accent-rose-500 rounded" />
                          <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
                          <span className="font-medium">{guest.first_name} {guest.last_name}</span>
                        </label>
                        {guest.plus_one && (
                          <label className="flex items-center gap-3 text-gray-700 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-200/50 hover:bg-white/90 transition-all cursor-pointer">
                            <input type="checkbox" name="attendee_ids" value={`${guest.id}_plus_one`} className="w-5 h-5 accent-rose-500 rounded" />
                            <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
                            <span className="font-medium">{guest.plus_one_name || 'Shoqëruesi/ja'}</span>
                          </label>
                        )}
                        {groupMembers?.map((m) => (
                          <label key={m.id} className="flex items-center gap-3 text-gray-700 bg-white/70 backdrop-blur-sm rounded-xl px-4 py-3 border border-blue-200/50 hover:bg-white/90 transition-all cursor-pointer">
                            <input type="checkbox" name="attendee_ids" value={m.id} className="w-5 h-5 accent-rose-500 rounded" />
                            <Heart className="h-4 w-4 text-rose-400" fill="currentColor" />
                            <span className="font-medium">{m.first_name} {m.last_name}</span>
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {!isGroup && (
                <div className="space-y-6">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                    A do të merrni pjesë?
                    <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-amber-500" />
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="attending" />
                      <Button className="w-full rounded-2xl font-bold py-6 md:py-8 text-lg md:text-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-xl transform hover:scale-105 transition-all duration-300">
                        <Heart className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" fill="currentColor" />
                        Po, do të vij!
                      </Button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="maybe" />
                      <Button variant="secondary" className="w-full rounded-2xl font-bold py-6 md:py-8 text-lg md:text-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
                        <Clock className="h-5 w-5 md:h-6 md:w-6 mr-2 md:mr-3" />
                        Ndoshta
                      </Button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="status" value="not_attending" />
                      <Button variant="destructive" className="w-full rounded-2xl font-bold py-6 md:py-8 text-lg md:text-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 shadow-xl transform hover:scale-105 transition-all duration-300">
                        Na vjen keq, s'mund
                      </Button>
                    </form>
                  </div>
                </div>
              )}

              {/* Footer Message - Mobile Responsive */}
              <div className="pt-6 md:pt-8 border-t border-rose-200/50">
                <p className="text-gray-600 text-base md:text-lg italic px-2">
                  "Dashuria është e vetmja forcë që mund ta transformojë një armik në mik" ❤️
                </p>
                <p className="text-sm text-gray-500 mt-2 px-2">
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