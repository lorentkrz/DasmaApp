import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function InvitationPage({ params }: { params: { token: string } }) {
  const supabase = await createClient()
  console.log('Invitation token:', params.token)

  // Fetch invitation (single or group) via public RPC (works for anon)
  const { data: partyRows, error: partyErr } = await supabase.rpc("get_invitation_and_party", { p_token: params.token })
  console.log('RPC response:', { partyRows, partyErr })
  
  if (partyErr) {
    console.error('RPC error:', partyErr)
    return notFound()
  }
  
  if (!partyRows || partyRows.length === 0) {
    console.log('No invitation found for token')
    return notFound()
  }
  const party = partyRows[0] as {
    invitation_id: string
    wedding_id: string
    is_group: boolean
    primary_guest_id: string
    primary_first_name: string
    primary_last_name: string
    members: Array<{ id: string; first_name: string; last_name: string; rsvp_status: string }>
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
    // Use secured RPCs (group-aware)
    const { error } = await supabase.rpc("set_party_response_by_token", {
      p_token: params.token,
      p_status: status,
      p_apply_all: applyAll,
      p_attendee_ids: attendeeIdsRaw.length > 0 ? attendeeIdsRaw : null,
    })
    if (error) {
      // If RPC fails, still redirect to thank-you to avoid leaking details
      redirect("/invite/thank-you")
    }
    redirect("/invite/thank-you")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-6 py-10 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">You're invited</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg">Hello {firstName} {lastName},</p>
            <p>Please confirm if you will attend.</p>

            {/* If group, show members and a toggle to apply to all */}
            {party.is_group && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">This invitation includes the following people:</div>
                <ul className="text-sm list-disc pl-5">
                  {party.members?.map((m) => (
                    <li key={m.id}>{m.first_name} {m.last_name}</li>
                  ))}
                </ul>

                {/* Apply to all */}
                <div className="flex gap-3">
                  <form action={updateRsvp}>
                    <input type="hidden" name="apply_all" value="true" />
                    <input type="hidden" name="status" value="attending" />
                    <Button type="submit" variant="default">Accept for everyone</Button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="apply_all" value="true" />
                    <input type="hidden" name="status" value="maybe" />
                    <Button type="submit" variant="secondary">Maybe for everyone</Button>
                  </form>
                  <form action={updateRsvp}>
                    <input type="hidden" name="apply_all" value="true" />
                    <input type="hidden" name="status" value="not_attending" />
                    <Button type="submit" variant="destructive">Decline for everyone</Button>
                  </form>
                </div>

                {/* Or select attendees */}
                <div className="pt-4 space-y-2">
                  <div className="text-sm font-medium">Or select who will attend:</div>
                  <form action={updateRsvp} className="space-y-3">
                    <div className="space-y-2">
                      {party.members?.map((m) => (
                        <label key={m.id} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" name="attendee_ids" value={m.id} />
                          <span>{m.first_name} {m.last_name}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="hidden" name="apply_all" value="false" />
                      <Button type="submit" name="status" value="attending" variant="default">Accept selected</Button>
                      <Button type="submit" name="status" value="maybe" variant="secondary">Maybe selected</Button>
                      <Button type="submit" name="status" value="not_attending" variant="destructive">Decline selected</Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!party.is_group && (
              <div className="flex gap-3">
                <form action={updateRsvp}>
                  <input type="hidden" name="status" value="attending" />
                  <Button type="submit" variant="default">Accept</Button>
                </form>
                <form action={updateRsvp}>
                  <input type="hidden" name="status" value="maybe" />
                  <Button type="submit" variant="secondary">Maybe</Button>
                </form>
                <form action={updateRsvp}>
                  <input type="hidden" name="status" value="not_attending" />
                  <Button type="submit" variant="destructive">Decline</Button>
                </form>
              </div>
            )}
            <div className="pt-4 text-sm text-muted-foreground">
              Powered by Wedding ERP
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

