import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound, redirect } from "next/navigation"
import { Playfair_Display, Great_Vibes, Cormorant_Garamond, Dancing_Script } from 'next/font/google'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Sparkles, Calendar, MapPin, Clock, Users } from "lucide-react"

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','600','700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400','700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400','600','700'] })

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

  // Format date information
  const dateObj = new Date(wedding.wedding_date)
  const month = dateObj.toLocaleDateString('en-US', { month: 'long' }).toUpperCase()
  const day = dateObj.getDate().toString()
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const time = wedding.ceremony_time ? wedding.ceremony_time.slice(0, 5) : '19:00'
  const venue = wedding.venue || 'Salla "Elegance"'

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
      
      <div className="absolute bottom-16 left-16 w-20 h-20 opacity-10 animate-pulse" style={{animationDelay: '2s'}}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <circle cx="40" cy="20" r="5" fill="#F4C2C2"/>
          <circle cx="28" cy="32" r="4" fill="#F5E6A3"/>
          <circle cx="52" cy="36" r="3" fill="#E8B4CB"/>
          <path d="M20 56 Q40 50 60 56 Q56 68 40 66 Q24 68 20 56" fill="#A8B5A0" opacity="0.6"/>
        </svg>
      </div>
      
      <div className="relative z-10 max-w-md sm:max-w-lg lg:max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-stone-200/30 overflow-hidden">
          
          {/* Header with integrated florals */}
          <div className="relative p-8 pb-6 text-center bg-gradient-to-b from-stone-50/50 to-white">
            
            {/* Subtle corner florals integrated into design */}
            <div className="absolute top-4 left-4 w-8 h-8 opacity-30">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <circle cx="8" cy="8" r="2" fill="#E8B4CB"/>
                <circle cx="16" cy="12" r="1.5" fill="#F5E6A3"/>
                <circle cx="24" cy="8" r="1" fill="#C8A2C8"/>
                <path d="M4 20 Q16 16 28 20 Q24 28 16 26 Q8 28 4 20" fill="#A8B5A0" opacity="0.6"/>
              </svg>
            </div>
            
            <div className="absolute top-4 right-4 w-8 h-8 opacity-30 transform scale-x-[-1]">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <circle cx="8" cy="8" r="2" fill="#F0E68C"/>
                <circle cx="16" cy="12" r="1.5" fill="#E8B4CB"/>
                <circle cx="24" cy="8" r="1" fill="#C8A2C8"/>
                <path d="M4 20 Q16 16 28 20 Q24 28 16 26 Q8 28 4 20" fill="#B8C5B0" opacity="0.6"/>
              </svg>
            </div>
            
            {/* Monogram with Heart */}
            <div className="mb-6">
              <div className={`${dancingScript.className} text-6xl font-semibold text-stone-700 leading-none flex items-center justify-center gap-3`}>
                {wedding.groom_name.charAt(0)}
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {wedding.bride_name.charAt(0)}
              </div>
            </div>
            
            {/* Albanian invitation text */}
            <div className="mb-6">
              <p className={`${cormorant.className} text-stone-600 text-base leading-relaxed mb-3`}>
                Tani e tutje ëndrrrën<br/>
                do e jetojmë së bashku!<br/>
                Sot, nesër dhe përgjithmonë...
              </p>
              <p className={`${cormorant.className} text-stone-500 text-sm leading-relaxed`}>
                Kemi nderin t'ju ftojmë<br/>
                në ceremoninë e martesës tonë.
              </p>
            </div>
            
            {/* Couple names */}
            <div className="mb-6">
              <h1 className={`${dancingScript.className} text-4xl font-medium text-stone-700 leading-tight`}>
                {wedding.groom_name}<br/>
                &<br/>
                {wedding.bride_name}
              </h1>
            </div>
            
            {/* Date */}
            <div className="mb-4">
              <p className={`${cormorant.className} text-xl font-semibold text-stone-800`}>
                {new Date(wedding.wedding_date).getDate()} {new Date(wedding.wedding_date).toLocaleDateString('sq-AL', { month: 'long' })} {new Date(wedding.wedding_date).getFullYear()}
              </p>
            </div>
            
            {/* Venue and time */}
            <div className="mb-6">
              <p className={`${cormorant.className} text-stone-700 text-base font-medium mb-1`}>
                {wedding.venue_name || 'Venue TBA'}
              </p>
              {wedding.venue_address && (
                <p className={`${cormorant.className} text-stone-600 text-sm mb-2`}>
                  {wedding.venue_address}
                </p>
              )}
              <p className={`${cormorant.className} text-stone-500 text-sm`}>
                Pritja e musafirëve: 19:00 - 20:00
              </p>
            </div>
            
            {/* Guest name */}
            <div className="mb-6">
              <p className={`${playfair.className} text-lg font-medium text-stone-800 mb-1`}>
                {groupMembers && groupMembers.length > 0 ? (
                  `Familja ${guest.last_name}`
                ) : (
                  `${guest.first_name} ${guest.last_name}`
                )}
              </p>
              {groupMembers && groupMembers.length > 0 && (
                <p className={`${cormorant.className} text-stone-600 text-sm`}>
                  {guest.first_name}, {groupMembers.map((m: any) => m.first_name).join(', ')}
                </p>
              )}
            </div>
            
            {/* RSVP text */}
            <div>
              <p className={`${cormorant.className} text-stone-600 text-base font-medium`}>
                Ju lutemi konfirmoni<br/>
                pjesëmarrjen tuaj
              </p>
            </div>
            
          </div>
          
          {/* RSVP Section */}
          <div className="p-6 bg-stone-50/50">
            {isGroup ? (
              <div className="space-y-4">
                {/* Group response */}
                <div>
                  <p className={`${cormorant.className} text-stone-600 text-sm mb-3 text-center`}>Përgjigja për të gjithë grupin:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="attending" />
                      <button className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
                        Po, vijmë të gjithë
                      </button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="maybe" />
                      <button className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors">
                        Ndoshta
                      </button>
                    </form>
                    <form action={updateRsvp}>
                      <input type="hidden" name="apply_all" value="true" />
                      <input type="hidden" name="status" value="not_attending" />
                      <button className="w-full py-3 px-4 bg-stone-400 hover:bg-stone-500 text-white rounded-xl text-sm font-medium transition-colors">
                        S'mundemi
                      </button>
                    </form>
                  </div>
                </div>
                
                {/* Individual selection */}
                <div className="bg-white rounded-2xl p-4">
                  <p className={`${cormorant.className} text-stone-600 text-sm mb-3 text-center`}>Ose zgjidh veçmas:</p>
                  <form action={updateRsvp} className="space-y-3">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors text-sm">
                        <input type="checkbox" name="attendee_ids" value={guest.id} className="w-4 h-4 accent-emerald-500" />
                        <span className="text-stone-700">{guest.first_name} {guest.last_name}</span>
                      </label>
                      {guest.plus_one && (
                        <label className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors text-sm">
                          <input type="checkbox" name="attendee_ids" value={`${guest.id}_plus_one`} className="w-4 h-4 accent-emerald-500" />
                          <span className="text-stone-700">{guest.plus_one_name || 'Shoqëruesi/ja'}</span>
                        </label>
                      )}
                      {groupMembers?.map((m: any) => (
                        <label key={m.id} className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg cursor-pointer hover:bg-stone-100 transition-colors text-sm">
                          <input type="checkbox" name="attendee_ids" value={m.id} className="w-4 h-4 accent-emerald-500" />
                          <span className="text-stone-700">{m.first_name} {m.last_name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="hidden" name="apply_all" value="false" />
                      <button name="status" value="attending" className="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors">
                        Konfirmo
                      </button>
                      <button name="status" value="maybe" className="py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors">
                        Ndoshta
                      </button>
                      <button name="status" value="not_attending" className="py-2 px-3 bg-stone-400 hover:bg-stone-500 text-white rounded-lg text-xs font-medium transition-colors">
                        Refuzo
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div>
                <p className={`${cormorant.className} text-stone-600 text-sm mb-4 text-center`}>A do të merrni pjesë?</p>
                <div className="grid grid-cols-1 gap-2">
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="attending" />
                    <button className="w-full py-4 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors">
                      Po, do të vij!
                    </button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="maybe" />
                    <button className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors">
                      Ndoshta
                    </button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="status" value="not_attending" />
                    <button className="w-full py-4 px-6 bg-stone-400 hover:bg-stone-500 text-white rounded-xl font-medium transition-colors">
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
  )
}