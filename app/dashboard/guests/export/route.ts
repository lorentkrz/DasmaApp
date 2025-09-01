import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  const { data: weddings } = await supabase
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  if (!weddings || weddings.length === 0) return new Response("No wedding", { status: 400 })
  const currentWedding = weddings[0]

  const { data: guests, error } = await supabase
    .from("guests")
    .select("first_name,last_name,email,phone,address,guest_type,dietary_restrictions,plus_one_allowed,plus_one_name,rsvp_status")
    .eq("wedding_id", currentWedding.id)
    .order("last_name", { ascending: true })

  if (error) return new Response(error.message, { status: 500 })

  const headers = [
    "first_name","last_name","email","phone","address","guest_type","dietary_restrictions","plus_one_allowed","plus_one_name","rsvp_status"
  ]
  const lines = [headers.join(",")]
  for (const g of guests || []) {
    const row = headers.map((h) => {
      const v = (g as any)[h]
      const s = v === null || v === undefined ? "" : String(v)
      const escaped = '"' + s.replace(/"/g, '""') + '"'
      return escaped
    })
    lines.push(row.join(","))
  }
  const csv = lines.join("\n")

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=guests.csv`,
      "Cache-Control": "no-store",
    },
  })
}
