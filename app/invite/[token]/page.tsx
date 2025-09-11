import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound, redirect } from "next/navigation"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Calendar, MapPin, Clock, Users } from "lucide-react"
import { notifyRsvpChange } from '@/lib/notify'
import Head from 'next/head'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

export async function generateMetadata() {
  return {
    viewport: {
      width: 'device-width',
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
    },
  }
}

export default async function InvitationPage({ params }: { params: { token: string } }) {
  const { token } = params
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
          // Fire notifications (service role) before redirect
          try {
            const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (serviceKey) {
              const service = createSupabaseServiceClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceKey
              )
              const { data: invMeta } = await service
                .from('invitations')
                .select('wedding_id, guest_id, group_id')
                .eq('token', token)
                .single()
              let guestNames = 'Mysafirë'
              let guestCount = 1
              let primaryId: string | null = invMeta?.guest_id || null
              if (!primaryId && invMeta?.group_id) {
                const { data: gg } = await service
                  .from('guest_groups')
                  .select('primary_guest_id')
                  .eq('id', invMeta.group_id)
                  .single()
                primaryId = gg?.primary_guest_id || null
              }
              if (primaryId) {
                const { data: pg } = await service
                  .from('guests')
                  .select('first_name,last_name')
                  .eq('id', primaryId)
                  .single()
                if (pg) guestNames = `${pg.first_name} ${pg.last_name}`
                // Estimate group size
                let memberIds: string[] = []
                const { data: aRows } = await service.from('guests').select('id').eq('group_id', primaryId)
                memberIds = [...(aRows || []).map((r: any) => r.id)]
                if (invMeta?.group_id) {
                  const { data: bRows } = await service.from('guests').select('id').eq('group_id', invMeta.group_id)
                  memberIds = Array.from(new Set([...memberIds, ...((bRows || []).map((r: any) => r.id))]))
                }
                guestCount = 1 + memberIds.length
              }
              await notifyRsvpChange({
                weddingId: invMeta?.wedding_id || '',
                status: status as any,
                guestNames,
                guestCount,
              })
            }
          } catch (notifyErr) {
            console.warn('RSVP notify (RPC path) error:', notifyErr)
          }
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
      
      // Notify (service role path)
      try {
        let guestNames = 'Mysafirë'
        // Use targetGuestId as primary for naming
        const { data: pg } = await service
          .from('guests')
          .select('first_name,last_name')
          .eq('id', targetGuestId as string)
          .single()
        if (pg) guestNames = `${pg.first_name} ${pg.last_name}`
        await notifyRsvpChange({
          weddingId: inv.wedding_id as string,
          status: status as any,
          guestNames,
          guestCount: Math.max(1, idsToUpdate.length),
        })
      } catch (notifyErr) {
        console.warn('RSVP notify (service path) error:', notifyErr)
      }
      
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

  // Format date information
  const dateObj = new Date(wedding.wedding_date)
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  const day = dateObj.getDate().toString()
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const time = wedding.ceremony_time ? wedding.ceremony_time.slice(0, 5) : '19:00'
  const venue = wedding.venue || 'Salla "Elegance"'

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-rose-50 to-rose-100 p-4 md:p-8 relative">
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
      
      <div className="absolute bottom-16 left-16 w-20 h-20 opacity-10 animate-pulse" style={{animationDelay: '2s'}}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="20" r="5" fill="#F4C2C2"/>
          <circle cx="28" cy="32" r="4" fill="#F5E6A3"/>
          <circle cx="52" cy="36" r="3" fill="#E8B4CB"/>
          <path d="M20 56 Q40 50 60 56 Q56 68 40 66 Q24 68 20 56" fill="#A8B5A0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-lg mx-auto px-6 py-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-stone-200/30 overflow-hidden">
          
          {/* Header with elegant design */}
          <div className="relative p-6 pb-5 text-center bg-gradient-to-b from-stone-50/50 to-white">
            
            
            {/* Albanian invitation text */}
            <div className="mb-6">
              <p className={`${cormorant.className} text-stone-600 text-lg leading-relaxed mb-4`}>
                Me shumë dashuri dhe gëzim ju ftojmë
              </p>
              <p className={`${cormorant.className} text-stone-500 text-base leading-relaxed`}>
                të jeni pjesë e ditës sonë më të veçantë dhe të paharrueshme.
              </p>
            </div>
            
            {/* Couple names */}
            <div className="mb-6">
              <h1 className={`${dancingScript.className} text-4xl font-medium text-stone-700 leading-tight`}>
                {wedding.groom_name} & {wedding.bride_name}
              </h1>
            </div>
            
            {/* Wedding Details - Bigger */}
            <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-xl p-5 mb-6">
              <div className="space-y-3 text-base">
                <div className="flex items-center justify-center gap-3">
                  <Calendar className="h-5 w-5 text-rose-600" />
                  <span className={`${cormorant.className} font-semibold text-stone-800`}>
                    {new Date(wedding.wedding_date).getDate()} {new Date(wedding.wedding_date).toLocaleDateString('sq-AL', { month: 'long' })} {new Date(wedding.wedding_date).getFullYear()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600" />
                  <span className={`${cormorant.className} text-stone-700`}>19:00 - 20:00</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  <div className="text-center">
                    <span className={`${cormorant.className} text-stone-700`}>
                      {wedding.venue_name || 'Venue TBA'}
                    </span>
                    {wedding.venue_address && (
                      <div className={`${cormorant.className} text-stone-600 text-sm`}>
                        {wedding.venue_address}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Guest name with equal spacing */}
            <div className="bg-white/80 backdrop-blur-sm border border-stone-200/50 rounded-xl p-5">
              <div className="text-center">
                <div className="mb-4">
                  <p className={`${cormorant.className} text-stone-700 text-lg font-semibold`}>
                    I/E dashur
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Users className="h-5 w-5 text-stone-600" />
                  <span className={`${playfair.className} text-xl font-bold text-stone-800`}>
                    {groupMembers && groupMembers.length > 0 ? (
                      `Familja ${guest.last_name}`
                    ) : (
                      `${guest.first_name} ${guest.last_name}`
                    )}
                  </span>
                </div>
                {groupMembers && groupMembers.length > 0 && (
                  <div className="mb-4">
                    <p className={`${cormorant.className} text-stone-700 text-lg font-semibold`}>
                      {guest.first_name}, {groupMembers.map((m: any) => m.first_name).join(', ')}
                    </p>
                  </div>
                )}
                <div className="mb-0">
                  <p className={`${cormorant.className} text-stone-700 text-lg font-semibold`}>
                    do na nderoni me praninë tuaj
                  </p>
                </div>
              </div>
            </div>
            
          </div>
          
          {/* RSVP Section - Fixed at bottom */}
          <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-b from-stone-50/90 to-rose-50/80 backdrop-blur-sm border-t border-stone-200/50 p-4 z-10">
            {isGroup ? (
              <div className="space-y-6 w-full max-w-3xl mx-auto">
                {/* Group response */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3">
                  <p className={`${cormorant.className} text-stone-600 text-xs mb-3 text-center font-medium`}>Përgjigja për të gjithë grupin:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="attending" />
                      <button className="w-full py-1 px-2 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        Po, vijmë të gjithë
                      </button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="maybe" />
                      <button className="w-full py-1 px-2 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        Ndoshta
                      </button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="not_attending" />
                      <button className="w-full py-1 px-2 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        S'mundemi
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Individual selection */}
                <div className="bg-white/90 backdrop-blur-sm border border-stone-200/50 rounded-xl p-3">
                  <p className={`${cormorant.className} text-stone-600 text-xs mb-3 text-center font-medium`}>Ose zgjidh veçmas:</p>
                  <form action={updateRsvp} className="space-y-2">
                    <div className="space-y-1">
                      <label className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-md cursor-pointer hover:bg-stone-100 transition-colors text-xs">
                        <input type="checkbox" name="attendee_ids" value={guest.id} className="w-3 h-3 accent-emerald-500" />
                        <span className="text-stone-700">{guest.first_name} {guest.last_name}</span>
                      </label>
                      {guest.plus_one && (
                        <label className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-md cursor-pointer hover:bg-stone-100 transition-colors text-xs">
                          <input type="checkbox" name="attendee_ids" value={`${guest.id}_plus_one`} className="w-3 h-3 accent-emerald-500" />
                          <span className="text-stone-700">{guest.plus_one_name || 'Shoqëruesi/ja'}</span>
                        </label>
                      )}
                      {groupMembers?.map((m: any) => (
                        <label key={m.id} className="flex items-center gap-2 p-1.5 bg-stone-50 rounded-md cursor-pointer hover:bg-stone-100 transition-colors text-xs">
                          <input type="checkbox" name="attendee_ids" value={m.id} className="w-3 h-3 accent-emerald-500" />
                          <span className="text-stone-700">{m.first_name} {m.last_name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <input type="hidden" name="apply_all" value="false" />
                      <button name="status" value="attending" className="py-0.5 px-1.5 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        Po
                      </button>
                      <button name="status" value="maybe" className="py-0.5 px-1.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        Ndoshta
                      </button>
                      <button name="status" value="not_attending" className="py-0.5 px-1.5 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-md text-xs font-bold transition-all duration-200 shadow-sm hover:shadow-md">
                        Jo
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm border border-stone-200/50 rounded-xl p-3">
                <p className={`${cormorant.className} text-stone-700 text-lg font-bold text-center mb-4`}>A do të merrni pjesë?</p>
                <div className="grid grid-cols-1 gap-2">
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="attending" />
                    <button className="w-full py-1.5 px-3 bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white rounded-md text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg">
                      Po, do të vij!
                    </button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="maybe" />
                    <button className="w-full py-1.5 px-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-md text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg">
                      Ndoshta
                    </button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="not_attending" />
                    <button className="w-full py-1.5 px-3 bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white rounded-md text-sm font-bold transition-all duration-200 shadow-md hover:shadow-lg">
                      Nuk mundem
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}