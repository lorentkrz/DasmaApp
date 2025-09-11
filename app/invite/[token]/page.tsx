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
import InvitationCard from './_components/invitation-card'

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400', '600', '700'] })
const greatVibes = Great_Vibes({ subsets: ['latin'], weight: '400' })
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '700'] })
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '600', '700'] })

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
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Get invitation details first
  const { data: invitation, error: inviteErr } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .single();

  if (inviteErr || !invitation) return notFound();

  // Get wedding details; if anon is blocked by RLS, fall back to service role
  let weddingData = null as any;
  {
    const { data } = await supabase
      .from("weddings")
      .select("*")
      .eq("id", invitation.wedding_id)
      .single();
    weddingData = data;
    if (!weddingData && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: sData } = await service
        .from("weddings")
        .select("*")
        .eq("id", invitation.wedding_id)
        .single();
      weddingData = sData;
    }
  }

  // Get guest details separately (handle both individual and group invitations)
  let guestData = null as any;
  const tryFetchGuestById = async (guestId: string) => {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("id", guestId)
      .single();
    if (data) return data;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: sData } = await service
        .from("guests")
        .select("*")
        .eq("id", guestId)
        .single();
      return sData;
    }
    return null;
  };
  if (invitation.guest_id) {
    guestData = await tryFetchGuestById(invitation.guest_id);
  } else if (invitation.group_id) {
    // For group invitations, get the primary guest
    let groupData: { primary_guest_id: string } | null = null;
    {
      const { data } = await supabase
        .from("guest_groups")
        .select("primary_guest_id")
        .eq("id", invitation.group_id)
        .single();
      groupData = data;
      if (!groupData && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const service = createSupabaseServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: sData } = await service
          .from("guest_groups")
          .select("primary_guest_id")
          .eq("id", invitation.group_id)
          .single();
        groupData = sData;
      }
    }
    if (groupData?.primary_guest_id) {
      guestData = await tryFetchGuestById(groupData.primary_guest_id);
    }
  }

  if (!weddingData || !guestData) return notFound();

  const wedding = weddingData;
  const guest = guestData;

  // Check if this is a group invitation (guest_groups schema)
  const effectiveGroupId = invitation.group_id || guest.group_id;
  let groupMembers: any[] | null = null;
  if (effectiveGroupId) {
    const { data } = await supabase
      .from("guests")
      .select("*")
      .eq("group_id", effectiveGroupId)
      .neq("id", guest.id);
    groupMembers = data || null;
    if (
      (!groupMembers || groupMembers.length === 0) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: sData } = await service
        .from("guests")
        .select("*")
        .eq("group_id", effectiveGroupId)
        .neq("id", guest.id);
      groupMembers = sData || null;
    }
  }

  const isGroup = (groupMembers && groupMembers.length > 0) || guest.plus_one;
  const firstName = guest.first_name;
  const lastName = guest.last_name;

  async function updateRsvp(formData: FormData) {
    "use server";
    const status = formData.get("status") as
      | "attending"
      | "not_attending"
      | "maybe"
      | null;
    const applyAll = formData.get("apply_all") === "true";
    const attendeeIdsRaw = formData.getAll("attendee_ids") as string[];
    let targetGuestId: string | null = null;
    try {
      if (!status) {
        throw new Error("Missing RSVP status in submission");
      }
      console.log("Submitting RSVP:", {
        status,
        applyAll,
        attendeeIds: attendeeIdsRaw,
        token: token,
      });

      // First, try the SECURITY DEFINER RPC so it works even without service role key
      try {
        const cookieStore = await cookies();
        const supabaseAnon = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            cookies: {
              get(name: string) {
                return cookieStore.get(name)?.value;
              },
            },
          }
        );
        // Prepare attendee UUIDs (strip plus_one markers and validate)
        const uuidLike = (v: string) =>
          /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
            v
          );
        const attendeeUuids = (attendeeIdsRaw || [])
          .filter((v) => !v.endsWith("_plus_one"))
          .filter((v) => uuidLike(v));
        const { data: rpcData, error: rpcError } = await supabaseAnon.rpc(
          "update_rsvp_by_token",
          {
            p_token: token,
            p_status: status,
            p_apply_all: applyAll,
            p_attendee_ids: attendeeUuids.length > 0 ? attendeeUuids : null,
          }
        );
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
              .join(",")
          );
          return redirect(
            `/invite/thank-you?status=${status}&token=${token}&updated=${updatedParam}`
          );
        }
        if (rpcError) {
          console.warn(
            "RPC update_rsvp_by_token failed, will fall back to service role path:",
            rpcError
          );
        } else {
          console.warn(
            "RPC update_rsvp_by_token returned no rows, falling back to service role path"
          );
        }
      } catch (rpcCatchErr) {
        console.warn(
          "RPC attempt threw, will fall back to service role path:",
          rpcCatchErr
        );
      }

      // Use service role server-side to bypass RLS safely
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceKey) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY on server");
      }
      const service = createSupabaseServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey
      );

      // Resolve invitation by token
      const { data: inv, error: invErr } = await service
        .from("invitations")
        .select("id, token, guest_id, group_id, wedding_id")
        .eq("token", token)
        .single();
      if (invErr || !inv) {
        throw new Error(`Invalid invitation token`);
      }

      // Resolve target guest: prefer invitation.guest_id, else group's primary guest
      targetGuestId = inv.guest_id as string | null;
      if (!targetGuestId && inv.group_id) {
        const { data: gg, error: ggErr } = await service
          .from("guest_groups")
          .select("primary_guest_id")
          .eq("id", inv.group_id)
          .single();
        if (ggErr) throw ggErr;
        targetGuestId = gg?.primary_guest_id || null;
      }
      if (!targetGuestId) {
        throw new Error("No guest resolved for this invitation");
      }

      // Collect group member IDs (including primary guest) accommodating both schemas:
      // A) members have group_id = primary_guest_id
      // B) members have group_id = invitations.group_id (a shared group UUID)
      const groupIds: string[] = [targetGuestId];
      let groupRowsA: { id: string }[] | null = null;
      let groupRowsB: { id: string }[] | null = null;
      // Try schema A: group_id equals primary guest id
      const { data: aRows, error: aErr } = await service
        .from("guests")
        .select("id")
        .eq("group_id", targetGuestId);
      if (aErr) throw aErr;
      groupRowsA = aRows || [];
      // Try schema B: group_id equals invitations.group_id
      if (inv.group_id) {
        const { data: bRows, error: bErr } = await service
          .from("guests")
          .select("id")
          .eq("group_id", inv.group_id);
        if (bErr) throw bErr;
        groupRowsB = bRows || [];
      }
      for (const r of [...(groupRowsA || []), ...(groupRowsB || [])]) {
        if (r.id && !groupIds.includes(r.id)) groupIds.push(r.id);
      }

      // Utility: stricter UUID pattern
      const uuidLike = (v: string) =>
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
          v
        );

      // Determine which IDs to update
      let idsToUpdate: string[] = [];
      if (applyAll) {
        idsToUpdate = groupIds;
      } else if (attendeeIdsRaw && attendeeIdsRaw.length > 0) {
        idsToUpdate = attendeeIdsRaw
          .filter((v) => !v.endsWith("_plus_one")) // ignore plus-one marker without dedicated row
          .map((v) => v) // keep as-is
          .filter((v) => uuidLike(v))
          .filter((v, i, arr) => arr.indexOf(v) === i) // dedupe
          .filter((v) => groupIds.includes(v)); // ensure only members from this invitation (either schema)
      } else {
        // No selections provided; default to updating only the primary guest
        idsToUpdate = [targetGuestId];
      }

      if (idsToUpdate.length > 0) {
        const { data: updatedRows, error: updErr } = await service
          .from("guests")
          .update({
            rsvp_status: status,
            rsvp_responded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .in("id", idsToUpdate)
          .select("id");
        if (updErr) throw updErr;
        if (!updatedRows || updatedRows.length === 0) {
          console.error("RSVP update affected 0 rows", {
            idsToUpdate,
            status,
            token,
            targetGuestId,
            groupIds,
          });
          throw new Error("RSVP update did not affect any rows");
        }
      }

      // Update invitation timestamps
      const { error: invUpdErr } = await service
        .from("invitations")
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
      console.error("RSVP update error:", error);
      // Still redirect even on error to show thank you page
    }

    // Always redirect immediately - include which IDs were updated for display
    const updatedParam = encodeURIComponent(
      attendeeIdsRaw && attendeeIdsRaw.length > 0
        ? attendeeIdsRaw
          .filter((v) => !v.endsWith("_plus_one"))
          .filter((v) => /[0-9a-fA-F-]{36}/.test(v))
          .filter((v, i, arr) => arr.indexOf(v) === i)
          .join(",")
        : applyAll
          ? "ALL"
          : targetGuestId || ""
    );

    redirect(
      `/invite/thank-you?status=${status}&token=${token}&updated=${updatedParam}`
    );
  }

  // Format date information
  const dateObj = new Date(wedding.wedding_date);
  const month = dateObj
    .toLocaleDateString("en-US", { month: "long" })
    .toUpperCase();
  const day = dateObj.getDate().toString();
  const weekday = dateObj
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const time = wedding.ceremony_time
    ? wedding.ceremony_time.slice(0, 5)
    : "19:00";
  const venue = wedding.venue || 'Salla "Elegance"';

  return <InvitationCard />;
}
